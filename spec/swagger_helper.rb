require 'rails_helper'
require 'rswag/specs'

RSpec.configure do |config|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API docs, ensure this
  # path matches the 'swagger_root' specified in your config/initializers/rswag_api.rb
  config.swagger_root = Rails.root.join('swagger').to_s

  # Define one or more Swagger documents and provide global metadata for each.
  # The generated Swagger JSON will then be exposed at '/api-docs/v1/swagger.yaml',
  # '/api-docs/v2/swagger.yaml', etc.
  config.swagger_docs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'ProxySock API',
        version: 'v1',
        description: 'API for Resellers to manage proxies, VMs, and orders.'
      },
      paths: {},
      servers: [
        {
          url: 'https://{defaultHost}',
          variables: {
            defaultHost: {
              default: 'api.proxysock.com'
            }
          }
        },
        {
          url: 'http://localhost:3000',
          description: 'Local development server'
        }
      ],
      components: {
        securitySchemes: {
          Bearer: {
            type: :http,
            scheme: :bearer,
            bearerFormat: 'JWT',
            description: 'Enter your JWT token here. Get it from /api/v1/auth/token'
          }
        }
      },
      security: [
        { Bearer: [] }
      ]
    }
  }

  # Specify the format of the output Swagger file when running 'rswag:specs:swaggerize'.
  # The swagger_docs configuration section defines the structure of the output file.
  # content_type 'application/json' # defaults to json
  config.swagger_format = :yaml
end
