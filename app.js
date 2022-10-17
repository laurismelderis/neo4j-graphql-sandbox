const express = require('express')
const app = express()
const { graphqlHTTP } = require('express-graphql')

const schema = require('./schema/schema')

app.use(express.json())
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}))

app.get('/', (req, res) => {
    res.send('Try using /graphql')
})

app.listen(4000, () => {
    console.log('Listening on port 4000')
})

module.exports = app;