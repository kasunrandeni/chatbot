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

app.post('/getbranches', (req, res) => {

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
				const branches = JSON.parse(completeResponse)

				return res.json({
					fulfillmentText: branches[0].name,
					source: 'getbranches'
				})
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'getbranches'
			})
		}
	)
})

app.post('/getservices', (req, res) => {

	const branchId =
		req.body.result && req.body.result.parameters && req.body.result.parameters.branch
			? req.body.result.parameters.branch
			: ''

	var options = {
	  host: hostName,
	  port: 443,
	  path: '/rest/entrypoint/branches/' + branchId + '/services',
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
				  const services = JSON.parse(completeResponse)
  
				  return res.json({
					  fulfillmentText: services[0].externalName,
					  source: 'getservices'
				  })
			  })
		  },
		  error => {
			  return res.json({
				  fulfillmentText: 'Could not get results at this time',
				  source: 'getservices'
			  })
		  }
	  )
  })

  app.post('/getticket', (req, res) => {

	const branchId =
		req.body.result && req.body.result.parameters && req.body.result.parameters.branch
			? req.body.result.parameters.branch
			: ''

	var options = {
	  host: hostName,
	  port: 443,
	  path: '/rest/entrypoint/branches/' + branchId + '/services',
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
				  const services = JSON.parse(completeResponse)
  
				  return res.json({
					  fulfillmentText: services[0].externalName,
					  source: 'getticket'
				  })
			  })
		  },
		  error => {
			  return res.json({
				  fulfillmentText: 'Could not get results at this time',
				  source: 'getticket'
			  })
		  }
	  )
  })
