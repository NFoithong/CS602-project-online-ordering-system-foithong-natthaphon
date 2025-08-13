const { gql } = require('apollo-server-express');

module.exports = gql`

type User { id: ID! email: String! role: String! name: String! }
type Category { id: ID! name: String! }
type MenuItem { id: ID! name: String! description: String price: Float! imageUrl: String categories: [Category!]! isAvailable: Boolean! }
type OrderItem { menuItem: ID! name: String! price: Float! quantity: Int! notes: String }
type Order { id: ID! user: User! items: [OrderItem!]! subtotal: Float! tax: Float! total: Float! status: String! fulfillment: String! address: String createdAt: String }

type Query {
  me: User
  categories: [Category!]!
  menu: [MenuItem!]!
  myOrders: [Order!]!
}

type AuthPayload { token: String! user: User! }

input OrderItemInput { menuItem: ID!, quantity: Int!, notes: String }
input MenuItemInput { name: String!, description: String, price: Float!, imageUrl: String, categories: [ID!], isAvailable: Boolean }

type Mutation {
  register(email: String!, password: String!, name: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  placeOrder(items: [OrderItemInput!]!, fulfillment: String, address: String): Order!

  # Admin
  addMenuItem(input: MenuItemInput!): MenuItem!
  updateMenuItem(id: ID!, input: MenuItemInput!): MenuItem!
  deleteMenuItem(id: ID!): Boolean!
}
`;
