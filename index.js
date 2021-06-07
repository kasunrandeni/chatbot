const express = require('express')
// will use this later to send requests
const https = require('https')
// import env variables

const app = express()
const port = process.env.PORT || 3001

const hostName = 'msqa01.qmatic.cloud'

var branchData = [];
var serviceData = [];

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
	res.status(200).send('Server is working.')
})

app.listen(port, () => {
	console.log(`🌏 Server is running at http://localhost:${port}`)
})

app.post('/getticket', (req, res) => {

	const action = req.body.queryResult.action;
	const branchName = req.body.queryResult.parameters.branch
	var authToken = req.headers['authorization'];

	const serviceName = req.body.queryResult.parameters.service

	var reqPath = '';
	var reqMethod = '';
	if  (action === 'getbranches') {
		reqMethod = 'GET';
		reqPath = '/qsystem/mobile/rest/v2/branches/?longitude=0&latitude=0&radius=2147483647';
	}
	if (action === 'getservices') {
		reqMethod = 'GET';
		reqPath = '/qsystem/mobile/rest/v2/services/';
	} 
	if (action === 'getticket') {
		reqMethod = 'POST';
		let branchMap = branchData.find(x =>{
			return x.name === branchName;
		})
		let serviceMap = serviceData.find(x =>{
			return x.name === serviceName;
		})
		reqPath = '/qsystem/mobile/rest/v2/services/'+ serviceMap.id +'/branches/'+ branchMap.id +'/ticket/issue/';
	}

	var options = {
	  host: hostName,
	  port: 443,
	  path: reqPath,
	  method: reqMethod,
	  // authentication headers
	  headers: {
		 'Authorization': authToken
	  }   
	};
      console.log(reqPath)
	  https.get(
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
					serviceData = resObj;
					var t = '';
					resObj.forEach(x => {
						t = t + '\n' + x.name
					});
					return res.json({
						fulfillmentText: t,
						source: action
					})
				  } else if (action === 'getbranches') {
					  branchData = resObj;
					  var t = '';
					  resObj.forEach(x => {
						t = t + '\n' + x.name
					  });
					  return res.json({
						fulfillmentText: t,
						source: action
					  })
				  } else if (action === 'getticket') {
					return res.json({
						fulfillmentText: resObj.ticketNumber,
						source: action
					  })
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
