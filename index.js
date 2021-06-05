const express = require('express')
// will use this later to send requests
const https = require('https')
// import env variables

const app = express()
const port = process.env.PORT || 3001

const hostName = 'msqa01.qmatic.cloud'
const basicAuth = 'Basic dGVzdDpUZXN0QDIwMjE='

var branchData = [];

const loadBranches = function(){
	var options = {
		host: hostName,
		port: 443,
		path: '/rest/entrypoint/branches',
		// authentication headers
		headers: {
		   'Authorization': basicAuth
		}   
	  };
	
	https.get(
		options,
		responseFromAPI => {
			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
				completeResponse += chunk
			})
			responseFromAPI.on('end', () => {
				const resObj = JSON.parse(completeResponse)
				branchData = resObj;
			})
		},
		error => {
			console.log('error for load branches')
		}
	)
}


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
	res.status(200).send('Server is working.')
})

app.listen(port, () => {
	loadBranches();
	console.log(`🌏 Server is running at http://localhost:${port}`)
})

app.post('/getticket', (req, res) => {

	const action = req.body.queryResult.action;
	const branchName = req.body.queryResult.parameters.branch

	console.log('action name --- ' + action)

	const serviceId = req.body.queryResult.parameters.service

	console.log('branch - ' + branchName + ' --- service - ' + serviceId)

	console.log(serviceId)

	var reqPath = '';
	var sourceName = 'getbranch'
	if  (action === 'getbranches') {
		var t = '';
		branchData.forEach(x => {
			t = t + '\n' + x.name
		});
		return res.json({
			fulfillmentText: t,
			source: action
		})
	}
	if (action === 'getservices') {
		let branchMap = branchData.find(x =>{
			return x.name === branchName;
		})
		reqPath = '/rest/entrypoint/branches/' + branchMap.id + '/services';
		sourceName =  'getservice'
	} 
	if (branchName !== undefined && serviceId !== undefined) {
		sourceName =  'getticket'
	}

	var options = {
	  host: hostName,
	  port: 443,
	  path: reqPath,
	  // authentication headers
	  headers: {
		 'Authorization': basicAuth
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
				  const resObj = JSON.parse(completeResponse)
  
				  var resText = ''
				  if (action === 'getservices') {
					var t = '';
					resObj.forEach(x => {
						t = t + '\n' + x.externalName
					});
					return res.json({
						fulfillmentText: t,
						source: action
					})
				  }
			  })
		  },
		  error => {
			  return res.json({
				  fulfillmentText: 'Could not get results at this time',
				  source: sourceName
			  })
		  }
	  )
  })
