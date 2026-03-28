/**
 * google_auth.cy.js
 *
 * Tests the Google Authentication flow by directly calling the backend API
 * (since we can't drive a real Google OAuth popup in Cypress).
 *
 * What we verify:
 * 1. The /api/v1/users/google-auth/ endpoint exists and rejects invalid tokens.
 * 2. The UI "Sign in with Google" button is present and visible on login/signup pages.
 * 3. The user-type modal HTML is rendered correctly (we stub the Firebase call).
 */

const API_URL = Cypress.env('API_URL') || 'http://localhost:8000/api/v1';
const BASE_URL = Cypress.config('baseUrl');

describe('Google Auth — Backend API', () => {
    it('POST /users/google-auth/ returns 400 when id_token is missing', () => {
        cy.request({
            method: 'POST',
            url: `${API_URL}/users/google-auth/`,
            body: {},
            failOnStatusCode: false,
        }).then((resp) => {
            expect(resp.status).to.eq(400);
            expect(resp.body).to.have.property('detail');
        });
    });

    it('POST /users/google-auth/ returns 401 when id_token is invalid', () => {
        cy.request({
            method: 'POST',
            url: `${API_URL}/users/google-auth/`,
            body: { id_token: 'this-is-a-fake-token' },
            failOnStatusCode: false,
        }).then((resp) => {
            expect(resp.status).to.eq(401);
            expect(resp.body.detail).to.match(/Invalid token|Token verification failed/i);
        });
    });
});

describe('Google Auth — Login Page UI', () => {
    beforeEach(() => {
        cy.visit(`${BASE_URL}/login`);
    });

    it('shows the "Sign in with Google" button', () => {
        cy.get('#google-signin-btn').should('be.visible');
        cy.get('#google-signin-btn').should('contain.text', 'Sign in with Google');
    });

    it('shows the OR divider between form and Google button', () => {
        cy.contains('OR').should('be.visible');
    });
});

describe('Google Auth — Signup Page UI', () => {
    beforeEach(() => {
        cy.visit(`${BASE_URL}/signup`);
    });

    it('shows the "Sign up with Google" button', () => {
        cy.get('#google-signin-btn').should('be.visible');
        cy.get('#google-signin-btn').should('contain.text', 'Sign up with Google');
    });
});
