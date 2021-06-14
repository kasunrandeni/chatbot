const express = require('express')
// will use this later to send requests
const https = require('https')
const http = require('http')
// import env variables

const app = express()
const port = process.env.PORT || 3001

var sessionData = [];

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
	res.status(200).send('Server is working.')
})

app.listen(port, () => {
	console.log(`🌏 Server is running at http://localhost:${port}`)
})

const buildResponse = function(resObj, objName, action){
	var tmp = [];
	resObj.forEach(x => {
		tmp.push(x[objName])
	});
	return {
		fulfillmentMessages: [
			{
				"quickReplies": {
				  "title": action === 'getbranches' ? "Please select your branch" : "Please select your service",
				  "quickReplies": tmp
				},
				"platform": "TELEGRAM"
			},
			{
				"quickReplies": {
				  "title": action === 'getbranches' ? "Please select your branch" : "Please select your service",
				  "quickReplies": tmp
				},
				"platform": "FACEBOOK"
			},
			{
				"text": {
				  "text": [
					(action === 'getbranches' ? "What is your preferred branch?" : "What is your preferred service?") + ' ' + tmp.toString(),
				  ]
				}
			}
		]
	}
}

const buildTicketResponse = function(resObj, isSSL, hostName){
	var mobileTicketUrl = isSSL ? 'https://' : 'http://';
	mobileTicketUrl = mobileTicketUrl + hostName + '/ticket?branch='+ resObj.branchId +'&visit='+  resObj.visitId +'&checksum=' + resObj.checksum
	return {
		fulfillmentMessages: [
			{
			  "card": {
				"title": "Mobile Ticket",
				"subtitle": resObj.ticketNumber,
				"imageUri": "https://www.qmatic.com/hubfs/images/gl/lp/mobile%20ticket.png",
				"buttons": [
				  {
					"text": "Open Mobile Ticket",
					"postback": mobileTicketUrl
				  }
				]
			  },
			  "platform": "TELEGRAM"
			},
			{
			  "card": {
				"title": "Mobile Ticket",
				"subtitle": resObj.ticketNumber,
				"imageUri": "https://www.qmatic.com/hubfs/images/gl/lp/mobile%20ticket.png",
				"buttons": [
				  {
					"text": "Open Mobile Ticket",
					"postback": mobileTicketUrl
				  }
				]
			  },
			  "platform": "FACEBOOK"
			},
			{
			  "text": {
				"text": [
					"Create ticket " + resObj.ticketNumber + " for your request.  \n Please access your ticket through " + mobileTicketUrl
				]
			  }
			}
		  ]
	}
}

const updateSessionData = function(sessionObj, resObj, action) {
	var obj = sessionData.find(x => {
		return x.session === sessionObj
	})
	
	if (obj) {
		let index = sessionData.indexOf(obj);
		if(action === 'getbranches'){
			sessionData[index].branches = resObj
		} else if (action === 'getservices'){
			sessionData[index].services = resObj
		}
	}  else {
		var newSessionObj = {
			session : sessionObj
		}
		if(action === 'getbranches'){
			newSessionObj.branches = resObj
		} else if (action === 'getservices'){
			newSessionObj.services = resObj
		}

		sessionData.push(newSessionObj);
	}
}

const clearSession = function(session){
	sessionData = sessionData.find(x => {
		return x.session !== session
	})
}

app.post('/getticket', (req, res) => {

	const action = req.body.queryResult.action;
	const branchName = req.body.queryResult.parameters.branch
	var authToken = req.headers['auth-token'];
	var hostName = req.headers['api-gw']; 
	var isSSL = req.headers['api-gw-ssl'] === 'true' ? true :  false; 

	const serviceName = req.body.queryResult.parameters.service;

	const session = req.body.session;
	const userSession = sessionData.find(x=>{
		return x.session === session;
	})

	var reqPath = '';
	var reqMethod = '';
	if  (action === 'getbranches') {
		if (userSession && userSession.branches){
			return res.json(buildResponse(userSession.branches, 'name', action));
		} else {
			reqMethod = 'GET';
			reqPath = '/geo/branches/?longitude=0&latitude=0&radius=2147483647';
		}
	}
	if (action === 'getservices') {
		if (userSession && userSession.services){
			return res.json(buildResponse(userSession.services, 'serviceName', action))
		} else {
			if (userSession.branches) {
				const selectedBranch = userSession.branches.find(x=>{
					return x.name === branchName;
				})
				if (selectedBranch) {
					reqMethod = 'GET';
					reqPath = '/MobileTicket/branches/' + selectedBranch.id + '/services/wait-info';
				} else {
					return res.json({
						fulfillmentText: 'Please select branch first',
						source: action
					  })
				}
			} else {
				return res.json({
					fulfillmentText: 'Please select branch first',
					source: action
				  })
			}
		}
	} 
	if (action === 'getticket') {
		let selectedBranch = userSession.branches.find(x =>{
			return x.name === branchName;
		})
		let selectedService = userSession.services.find(x =>{
			return x.serviceName === serviceName;
		})

		if (selectedBranch && selectedService) {
			reqMethod = 'POST';
			reqPath = '/MobileTicket/services/'+selectedService.serviceId+'/branches/'+selectedBranch.id+'/ticket/issue';
		} else {
			return res.json({
				fulfillmentText: 'Please select branch & service first',
				source: action
			  })
		}
	}

	var options = {
	  host: hostName,
	  port: 443,
	  path: reqPath,
	  method: reqMethod,
	  // authentication headers
	  headers: {
		 'auth-token': authToken
	  }   
	};
      console.log(reqPath)
	var hostFramework;
	if  (isSSL){
		hostFramework  = https;
	} else  {
		hostFramework =  http;
	}
	  hostFramework.get(
		  options,
		  responseFromAPI => {
			  let completeResponse = ''
			  responseFromAPI.on('data', chunk => {
				  completeResponse += chunk
			  })
			  responseFromAPI.on('end', () => {
				var resObj = '';
			
				  try{
					resObj = JSON.parse(completeResponse);
				  } catch(e){
					return res.json({
						fulfillmentText: 'Somthing wrong with server' + completeResponse,
						source: action
					});
				  }
				  
				  if (action === 'getservices') {
					updateSessionData(session ,resObj, action)
					return res.json(buildResponse(resObj, 'serviceName', action));
				  } else if (action === 'getbranches') {
					updateSessionData(session, resObj, action)
					return res.json(buildResponse(resObj, 'name', action));
				  } else if (action === 'getticket') {
					clearSession(session)
					return res.json(buildTicketResponse(resObj, isSSL, hostName));
				  }
				  
			  })
		  },
		  error => {
			  return res.json({
				  fulfillmentText: 'Could not get results at this time',
				  source: action
			  })
		  }
	  )
  })
