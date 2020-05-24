const project = "default"

before(() => {
  // When changing the base URL within a spec file, Cypress runs the spec twice
  // To avoid rebuilding and redeployment on the second run, we check if the
  // project has already been deployed.
  cy.task('isDeployed').then(isDeployed => {
    // Cancel setup, if already deployed
    if(isDeployed)
      return

    // Clear project folder
    cy.task('clearProject', { project })

    // Copy NextJS files
    cy.task('copyFixture', {
      project, from: 'pages', to: 'pages'
    })
    cy.task('copyFixture', {
      project, from: 'next.config.js', to: 'next.config.js'
    })

    // Copy package.json file
    cy.task('copyFixture', {
      project, from: 'package.json', to: 'package.json'
    })

    // Copy Netlify settings
    cy.task('copyFixture', {
      project, from: 'netlify.toml', to: 'netlify.toml'
    })
    cy.task('copyFixture', {
      project, from: '.netlify', to: '.netlify'
    })

    // Build
    cy.task('buildProject', { project })

    // Deploy
    cy.task('deployProject', { project })
  })

  // Set base URL
  cy.task('getBaseUrl', { project }).then((url) => {
    Cypress.config('baseUrl', url)
  })
})

after(() => {
  // While the before hook runs twice (it's re-run when the base URL changes),
  // the after hook only runs once.
  cy.task('clearDeployment')
})

describe('SSR page', () => {
  it('loads TV shows', () => {
    cy.visit('/')

    cy.get('ul').first().children().should('have.length', 5)
  })

  it('loads TV shows when SSR-ing', () => {
    cy.ssr('/')

    cy.get('ul').first().children().should('have.length', 5)
  })
})

describe('dynamic SSR page', () => {
  it('loads TV show', () => {
    cy.visit('/shows/24251')

    cy.get('h1').should('contain', 'Show #24251')
    cy.get('p').should('contain',  'Animal Science')
  })

  it('loads TV show when SSR-ing', () => {
    cy.ssr('/shows/24251')

    cy.get('h1').should('contain', 'Show #24251')
    cy.get('p').should('contain',  'Animal Science')
  })
})

describe('dynamic catch-all SSR page', () => {
  it('displays all URL parameters, including query string parameters', () => {
    cy.visit('/shows/94/this-is-all/being/captured/yay?search=dog&custom-param=cat')

    // path parameters
    cy.get('p').should('contain', '[0]: 94')
    cy.get('p').should('contain', '[1]: this-is-all')
    cy.get('p').should('contain', '[2]: being')
    cy.get('p').should('contain', '[3]: captured')
    cy.get('p').should('contain', '[4]: yay')

    // query string parameters
    cy.get('p').should('contain', '[search]: dog')
    cy.get('p').should('contain', '[custom-param]: cat')

    cy.get('h1').should('contain', 'Show #94')
    cy.get('p').should('contain',  'Defiance')
  })

  it('displays all URL parameters when SSR-ing, including query string parameters', () => {
    cy.visit('/shows/94/this-is-all/being/captured/yay?search=dog&custom-param=cat')

    // path parameters
    cy.get('p').should('contain', '[0]: 94')
    cy.get('p').should('contain', '[1]: this-is-all')
    cy.get('p').should('contain', '[2]: being')
    cy.get('p').should('contain', '[3]: captured')
    cy.get('p').should('contain', '[4]: yay')

    // query string parameters
    cy.get('p').should('contain', '[search]: dog')
    cy.get('p').should('contain', '[custom-param]: cat')

    cy.get('h1').should('contain', 'Show #94')
    cy.get('p').should('contain',  'Defiance')
  })
})

describe('API endpoint', () => {
  it('returns hello world, with all response headers', () => {
    cy.request('/api/static').then(response => {
      expect(response.headers['content-type']).to.include('application/json')
      expect(response.headers['my-custom-header']).to.include('header123')

      expect(response.body).to.have.property('message', 'hello world :)')
    })
  })
})

describe('dynamic API endpoint', () => {
  it('returns TV show', () => {
    cy.request('/api/shows/305').then(response => {
      expect(response.headers['content-type']).to.include('application/json')

      expect(response.body).to.have.property('show')
      expect(response.body.show).to.have.property('id', 305)
      expect(response.body.show).to.have.property('name', 'Black Mirror')
    })
  })
})

describe('catch-all API endpoint', () => {
  it('returns all URL paremeters, including query string parameters', () => {
    cy.request('/api/shows/590/this/path/is/captured?metric=dog&p2=cat')
      .then(response => {
        expect(response.headers['content-type']).to.include('application/json')

        // Params
        expect(response.body).to.have.property('params')
        expect(response.body.params).to.deep.eq([
          '590', 'this', 'path', 'is', 'captured'
        ])

        // Query string parameters
        expect(response.body).to.have.property('queryStringParams')
        expect(response.body.queryStringParams).to.deep.eq({
          metric: 'dog',
          p2: 'cat'
        })

        // Show
        expect(response.body).to.have.property('show')
        expect(response.body.show).to.have.property('id', 590)
        expect(response.body.show).to.have.property('name', 'Pokémon')
    })
  })
})

describe('static page', () => {
  it('renders', () => {
    cy.visit('/static')

    cy.get('p').should('contain', 'It is a static page.')
  })

  it('renders when SSR-ing', () => {
    cy.visit('/static')

    cy.get('p').should('contain', 'It is a static page.')
  })
})

describe('dynamic static page', () => {
  it('renders', () => {
    cy.visit('/static/superdynamic')

    cy.get('p').should('contain', 'It is a static page.')
    cy.get('p').should('contain', 'it has a dynamic URL parameter: /static/:id.')
  })

  it('renders when SSR-ing', () => {
    cy.visit('/static/superdynamic')

    cy.get('p').should('contain', 'It is a static page.')
    cy.get('p').should('contain', 'it has a dynamic URL parameter: /static/:id.')
  })
})
