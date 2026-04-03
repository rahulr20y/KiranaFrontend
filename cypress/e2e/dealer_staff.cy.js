describe('Dealer Staff & Operational Delegation', () => {
    const dealerUsername = 'dealer_' + Math.random().toString(36).substring(7);
    const staffUsername = 'staff_' + Math.random().toString(36).substring(7);
    const password = 'Password@123';

    before(() => {
        // Create Dealer first
        cy.visit('/signup');
        cy.get('input[name="username"]').type(dealerUsername);
        cy.get('input[name="email"]').type(`${dealerUsername}@test.com`);
        cy.get('input[name="password"]').type(password);
        cy.get('input[name="confirmPassword"]').type(password);
        cy.get('select[name="user_type"]').select('dealer');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
    });

    it('should allow dealer to onboard a staff member', () => {
        cy.visit('/dashboard');
        // Go to Profile tab
        cy.contains('Profile').click();
        
        // Open staff form
        cy.contains('+ Add Staff Member').click();
        
        // Fill staff form
        cy.get('input[placeholder="e.g. rahul_staff"]').type(staffUsername);
        cy.get('input[placeholder="staff@email.com"]').type(`${staffUsername}@test.com`);
        cy.get('select').eq(1).select('Delivery Manager'); // Equation based on current DOM
        
        cy.intercept('POST', '**/api/v1/dealers/add_staff/').as('addStaff');
        cy.contains('Onboard Staff Member').click();
        cy.wait('@addStaff');
        
        // Verify staff appears in list
        cy.contains(staffUsername).should('be.visible');
        cy.contains('Delivery Manager').should('be.visible');
    });

    it('should restrict financial data for staff members', () => {
        // Logout dealer
        cy.get('button').contains('Log out').click();
        
        // Login as Staff
        cy.visit('/login');
        cy.get('input[name="username"]').type(staffUsername);
        cy.get('input[name="password"]').type('Staff@123'); // Default password from backend
        cy.get('button[type="submit"]').click();
        
        cy.url().should('include', '/dashboard');
        
        // Verify Analytics tab is NOT visible
        cy.contains('Analytics').should('not.exist');
        
        // Verify Staff Management is NOT visible in Profile
        cy.contains('Profile').click();
        cy.contains('Staff Management').should('not.exist');
        
        // Verify Logistics (Route) is visible
        cy.contains('Route').should('be.visible');
    });
});
