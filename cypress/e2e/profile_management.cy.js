describe('Profile Management Tests', () => {
    const baseUrl = Cypress.config('baseUrl');
    const timestamp = Date.now().toString().slice(-6);
    
    it('should allow a dealer to edit their business profile', () => {
        const username = `dealer_profile_${timestamp}`;
        const email = `${username}@example.com`;
        const newBusinessName = `Updated Wholesalers ${timestamp}`;

        // 1. Signup
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Dinesh', { force: true });
        cy.get('#last_name').type('ProfileTest', { force: true });
        cy.get('#username').type(username, { force: true });
        cy.get('#email').type(email, { force: true });
        cy.get('#password').type('Password123!', { force: true });
        cy.get('#password_confirm').type('Password123!', { force: true });
        cy.get('#user_type').select('dealer', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // 2. Go to Profile Tab
        cy.get('button').contains('Profile').click();
        cy.get('h2').contains('Business Profile').should('be.visible');

        // 3. Edit Profile
        cy.get('button').contains('Edit Profile').click();
        cy.get('input').filter(':visible').first().clear().type(newBusinessName);
        cy.get('button').contains('Save Changes').click();

        // 4. Verify Update
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Profile updated successfully!');
        });
        cy.get('p').contains(newBusinessName).should('be.visible');
        cy.get('button').contains('Edit Profile').should('be.visible');
    });

    it('should allow a shopkeeper to edit their shop profile', () => {
        const username = `shop_profile_${timestamp}`;
        const email = `${username}@example.com`;
        const newShopName = `Updated Mega Mart ${timestamp}`;

        // 1. Signup
        cy.visit(`${baseUrl}/signup`);
        cy.get('#first_name').type('Rajesh', { force: true });
        cy.get('#last_name').type('ProfileTest', { force: true });
        cy.get('#username').type(username, { force: true });
        cy.get('#email').type(email, { force: true });
        cy.get('#password').type('Password123!', { force: true });
        cy.get('#password_confirm').type('Password123!', { force: true });
        cy.get('#user_type').select('shopkeeper', { force: true });
        cy.get('button').contains('Create Account').click();

        cy.url({ timeout: 15000 }).should('include', '/dashboard');

        // 2. Go to Profile Tab
        cy.get('button').contains('Profile').click();
        cy.get('h2').contains('Business Profile').should('be.visible');

        // 3. Edit Profile
        cy.get('button').contains('Edit Profile').click();
        cy.get('input').filter(':visible').first().clear().type(newShopName);
        cy.get('button').contains('Save Changes').click();

        // 4. Verify Update
        cy.get('p').contains(newShopName).should('be.visible');
    });
});
