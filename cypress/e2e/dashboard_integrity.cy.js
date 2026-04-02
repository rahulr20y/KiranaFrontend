describe('Dashboard Integrity Check', () => {
  beforeEach(() => {
    // Reset data and seed necessary records
    cy.exec('docker exec kirana-backend python manage.py shell -c "from users.models import User; from products.models import Product; from orders.models import Order, OrderItem; from django.utils import timezone; import datetime; import uuid; user=User.objects.get(username=\'shopkeeperuser\'); user.set_password(\'password123\'); user.save(); dealer=User.objects.get(username=\'dealeruser\'); dealer.set_password(\'password123\'); dealer.save(); p, _ = Product.objects.get_or_create(dealer=dealer, name=\'Verification Product\', defaults={\'price\': 100, \'stock_quantity\': 50}); old_date = timezone.now() - datetime.timedelta(days=11); order = Order.objects.create(shopkeeper=user, dealer=dealer, status=\'delivered\', order_number=f\'ORD-TEST-{uuid.uuid4().hex[:6].upper()}\', total_amount=100, net_amount=100, shipping_address=\'Test Address\'); Order.objects.filter(id=order.id).update(created_at=old_date); OrderItem.objects.create(order=order, product=p, quantity=1, product_price=100, subtotal=100, product_name=p.name, unit=\'kg\');"');
  });

  it('verifies shopkeeper dashboard for static placeholders and broken links', () => {
    // Login as shopkeeper
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="username"]').type('shopkeeperuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Wait for the page to load and suggestions to appear
    cy.contains('Smart Stock Suggestions', { timeout: 15000 }).should('be.visible');

    // Check for "Quick Restock" function
    cy.get('button').contains('🛒 Quick Restock').first().should('be.visible').click();
    
    // It should redirect to /cart
    cy.url({ timeout: 10000 }).should('include', '/cart');
    cy.contains('Verification Product').should('be.visible');
    cy.contains('Confirm & Place Order').should('be.visible');
  });

  it('verifies dealer dashboard for typos and broken buttons', () => {
    // Login as dealer
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="username"]').type('dealeruser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // 1. Check that the forced version string is GONE (check navbar as well)
    cy.contains('[v1.7 FORCED]').should('not.exist');
    cy.contains('Dealer Dashboard').should('be.visible');

    // 2. Check that the typo placeholder in New Sale is GONE
    cy.get('button').contains('🤝 New Sale').should('be.visible').click();
    cy.get('input[placeholder="e.target.value"]').should('not.exist');
    cy.get('input[placeholder="Enter notes for this sale"]').should('exist');
    cy.get('button').contains('Cancel Sale').click();

    // 3. Check for product action buttons (Edit opens modal)
    cy.get('button').contains('Edit').first().should('be.visible').click();
    cy.get('div').contains('Edit Product').should('be.visible');
    cy.get('button').contains('Cancel').should('be.visible').click();
    cy.get('div').contains('Edit Product').should('not.exist');
  });
});
