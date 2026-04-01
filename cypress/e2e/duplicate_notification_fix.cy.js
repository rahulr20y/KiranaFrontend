describe('Duplicate Notification Fix Verification', () => {
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000';
    
    const shopkeeper = {
        username: 'shopkeeperuser',
        password: 'testpassword123'
    };

    it('should only show ONE toast notification when a notification event is received', () => {
        // 1. Visit Login
        cy.visit(`${baseUrl}/login`);
        
        // 2. Login as Shopkeeper
        cy.get('input[name="username"]').type(shopkeeper.username);
        cy.get('input[name="password"]').type(shopkeeper.password);
        cy.get('button').contains('Login').click();
        
        // 3. Ensure we are on the dashboard
        cy.url().should('include', '/dashboard');
        cy.contains('Shopkeeper Dashboard', { timeout: 10000 }).should('be.visible');

        // 4. Give WebSocket time to connect
        cy.wait(3000);

        // 5. Trigger a notification via Docker Exec
        const uniqueMsg = `Test_Msg_${Math.random().toString(36).substring(2, 7)}`;
        const command = `docker exec kirana-backend python manage.py shell -c "from django.contrib.auth import get_user_model; from notifications.utils import send_user_notification; User = get_user_model(); sk = User.objects.get(username='${shopkeeper.username}'); send_user_notification(sk, 'Update', '${uniqueMsg}', 'order_update')"`;
        
        cy.exec(command).its('code').should('eq', 0);

        // 6. Verify ONE toast appears
        // The toast should appear and contain the message
        // We use a more specific selector for the toast itself, not the container
        // CSS module classes look like toast_toast__XYZ
        cy.get('div[class*="toast_toast__"]').should('have.length', 1, { timeout: 15000 });
        cy.get('div[class*="toast_toast__"]').should('contain', uniqueMsg);
        
        // 7. Wait another 3s to ensure NO MORE toasts appear
        cy.wait(3000);
        cy.get('div[class*="toast_toast__"]').should('have.length', 1);
    });
});
