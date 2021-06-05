const express = require('express')
// will use this later to send requests
const https = require('https')
// import env variables

const app = express()
const port = process.env.PORT || 3001

const hostName = 'msqa01.qmatic.cloud'
const basicAuth = 'Basic dGVzdDpUZXN0QDIwMjE='


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
	res.status(200).send('Server is working.')
})

app.listen(port, () => {
	console.log(`🌏 Server is running at http://localhost:${port}`)
})

app.post('/getticket', (req, res) => {

	const branchId = req.body.queryResult.parameters.branch

	console.log(branchId)

	const serviceId = req.body.queryResult.parameters.service

	console.log(serviceId)

	var reqPath = '/rest/entrypoint/branches';
	var sourceName = 'getbranch'
	if (branchId !== undefined) {
		reqPath = '/rest/entrypoint/branches/' + branchId + '/services';
		sourceName =  'getservice'
	} 
	if (branchId !== undefined && serviceId !== undefined) {
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
				  if (sourceName === 'getbranch') {
					  resText = resObj[0].name
				  }  else if (sourceName === 'getservice') {
					  resText = resObj[0].externalName
				  }
				  return res.json({
					  fulfillmentText: resText,
					  source: sourceName
				  })
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
