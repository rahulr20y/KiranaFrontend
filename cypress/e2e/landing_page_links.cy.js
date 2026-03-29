describe('Landing Page Links', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  it('should verify Hero section buttons', () => {
    // Get Started Now button
    cy.contains('Get Started Now').parent().should('have.attr', 'href', '/signup')
    
    // Learn More button
    cy.contains('Learn More').parent().should('have.attr', 'href', '#features')
  })

  it('should verify CTA section button', () => {
    // Start Free Trial Today button
    cy.contains('Start Free Trial Today').parent().should('have.attr', 'href', '/signup')
  })

  it('should verify Navbar links', () => {
    // Features link
    cy.contains('nav a', 'Features').should('have.attr', 'href', '#features')
    
    // Roles link
    cy.contains('nav a', 'For Dealers & Shopkeepers').should('have.attr', 'href', '#roles')
    
    // Contact link
    cy.contains('nav a', 'Contact').should('have.attr', 'href', '#contact')
    
    // Login link
    cy.get('nav').contains('Login').parent().should('have.attr', 'href', '/login')
    
    // Signup link
    cy.get('nav').contains('Sign Up').parent().should('have.attr', 'href', '/signup')
  })

  it('should verify Footer links', () => {
    // Pricing
    cy.get('footer').contains('Pricing').should('have.attr', 'href', '#features')
    
    // Blog
    cy.get('footer').contains('Blog').should('have.attr', 'href', '/')
    
    // Help Center
    cy.get('footer').contains('Help Center').should('have.attr', 'href', '/')
    
    // Contact Us (mailto)
    cy.get('footer').contains('Contact Us').should('have.attr', 'href', 'mailto:support@kirana.example.com')
  })

  it('should scroll to Features section when "Features" link is clicked', () => {
    cy.contains('nav a', 'Features').click()
    cy.get('#features').should('be.visible')
  })

  it('should scroll to Footer when "Contact" link is clicked (via Contact anchor)', () => {
    cy.contains('nav a', 'Contact').click()
    cy.get('#contact').should('be.visible')
  })
})
