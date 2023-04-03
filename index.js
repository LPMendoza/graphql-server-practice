import { gql, ApolloServer, UserInputError } from "apollo-server";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const persons = [
  {
    "name": "Jose",
    "age": 20,
    "phone": "123-456-7890",
    "street": "123 Main St",
    "city": "New York",
    "id": "1"
  },
  {
    "name": "Peter",
    "age": 20,
    "street": "123 Main St",
    "city": "New York",
    "id": "2"
  }
]

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }
  type Address { 
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }
  
  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(
      name: String!
      phone: String!
    ): Person
  }
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      const { data: personsFromAPI } = await axios('http://localhost:3001/persons');
      if (!args.phone) return persons; 

      const byPhone = person => args.phone === 'YES' ? person.phone : !person.phone;
      
      return persons.filter(byPhone);
    },
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find(p => p.name === name);
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      const person = { ...args, id: uuidv4() }
      if (!persons.find(p => p.name === person.name)) {
        persons.push(person);
        console.log(persons)
      } else {
        // Error handling with graphql
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name
        });
      }
      return person;
    },
    editNumber: (root, args) => {
      const personIndex = persons.findIndex(p => p.name === args.name);
      if (personIndex === -1) return null;
      const person = persons[personIndex];
      const updatedPerson = { ...person, phone: args.phone };
      persons[personIndex] = updatedPerson;
      return updatedPerson;
    }
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city,
      };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});