const graphql = require('graphql')
const neo4j = require('neo4j-driver')

require('dotenv').config()
const { DB_USER, DB_PASSWORD, DB_URI } = process.env
const driver = neo4j.driver(
    DB_URI,
    neo4j.auth.basic(DB_USER, DB_PASSWORD)
)
const session = driver.session()

const books = require('../mocks/books')
const authors = require('../mocks/authors')

const {
        GraphQLObjectType,
        GraphQLString,
        GraphQLSchema,
        GraphQLID,
        GraphQLInt,
        GraphQLList,
    } = graphql

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        country: { type: GraphQLString },
        age: { type: GraphQLInt },
    })
})

const BookType = new GraphQLObjectType({
    name: 'Book',
    fields: () => ({
        id: { type: GraphQLID },
        country: { type: GraphQLString },
        imageLink: { type: GraphQLString },
        language: { type: GraphQLString },
        link: { type: GraphQLString },
        pages: { type: GraphQLInt },
        title: { type: GraphQLString },
        year: { type: GraphQLInt },
        author: { 
            type: AuthorType,
            resolve: (book) => {
                return authors.find(author => author.id === book.authorId)
            }
        },
    }),
})

const getAuthors = async () => {
    const { records } = await session.run("MATCH (n:AUTHOR) RETURN n;")
    let authors = []
    records.forEach((record) => {
        const author = record._fields[0].properties
        author.age = author.age.low
        authors.push(author)
    })
    return authors
}

const addAuthor = async (args) => {
    const { name, country, age } = args
    await session.run(`
        CREATE (:AUTHOR {
            name: "${name}",
            country: "${country}",
            age: ${age}
        })
    `)
}

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
        book: {
            type: BookType,
            args: {
                id: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return books.find(book => book.id === args.id)
            }
        },
        books: {
            type: new GraphQLList(BookType),
            resolve: (parent, args) => {
                return books
            },
        },
        authors: {
            type: new GraphQLList(AuthorType),
            resolve: async (parent, args) => {
                return await getAuthors(args)
            }
        },
    }),
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addAuthor: {
            type: AuthorType,
            args: {
                name: { type: GraphQLString },
                country: { type: GraphQLString },
                age: { type: GraphQLInt },
            },
            resolve: async (parent, args) => {
                await addAuthor(args)
                return args
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})