describe('Logistics Maturation System', () => {
    const ts = Date.now().toString().slice(-4);
    const dealer = {
        name: `D_${ts}`,
        username: `deal_${ts}`,
        password: 'Password123!',
        email: `deal_${ts}@test.com`
    };
    const staff = {
        username: `staf_${ts}`,
        email: `staf_${ts}@test.com`,
        password: 'Staff@123'
    };

    it('should verify warehouse location setting and incentive visibility', () => {
        // Dealer Signup
        cy.visit('/signup');
        cy.get('select[name="user_type"]').select('dealer');
        cy.get('input[name="first_name"]').type('Logistics');
        cy.get('input[name="last_name"]').type('Dealer');
        cy.get('input[name="username"]').type(dealer.username);
        cy.get('input[name="email"]').type(dealer.email);
        cy.get('input[name="password"]').type(dealer.password);
        cy.get('input[name="password_confirm"]').type(dealer.password);
        cy.get('button[type="submit"]').click();
        
        cy.url({ timeout: 20000 }).should('include', '/dashboard');

        // Verify/Set Warehouse Location
        cy.contains('Profile').click();
        cy.contains('Edit Profile').click();
        cy.get('input[name="latitude"]').clear().type('12.9716');
        cy.get('input[name="longitude"]').clear().type('77.5946');
        cy.contains('Save Changes').click();
        cy.contains('12.971600, 77.594600').should('be.visible');

        // Onboard Staff and Verify Incentive visibility
        cy.contains('General').click();
        cy.get('button').contains('Add Staff Member').click();
        cy.get('input[placeholder="e.g. rahul_staff"]').clear().type(staff.username);
        cy.get('input[placeholder="staff@email.com"]').clear().type(staff.email);
        cy.get('button').contains('Onboard Staff Member').click();
        
        // Verify staff card presence and incentive display
        cy.contains(staff.username, { timeout: 15000 }).should('be.visible');
        cy.contains('Incentives: ₹0').should('be.visible');

        // Verify Analytics tab visibility (header check only to avoid leaderboard data dependency)
        cy.contains('Analytics').click();
        cy.contains('Revenue & Volume Growth', { timeout: 10000 }).should('be.visible');
    });
});
