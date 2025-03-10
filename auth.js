// This file can contain more advanced Clerk functionality if needed
class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
    }
    
    async initialize() {
        if (!window.Clerk) {
            console.error('Clerk is not available');
            return false;
        }
        
        try {
            await window.Clerk.load();
            
            // Set up listeners
            window.Clerk.addListener(({ user }) => {
                this.user = user;
                this.isAuthenticated = !!user;
                this.onAuthStateChange(user);
            });
            
            // Initial state
            this.user = window.Clerk.user;
            this.isAuthenticated = !!this.user;
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Clerk:', error);
            return false;
        }
    }
    
    onAuthStateChange(user) {
        // This is a placeholder for a callback function
        // It should be overridden by the consumer of this class
        console.log('Auth state changed:', user ? 'signed in' : 'signed out');
    }
    
    async signIn() {
        if (!window.Clerk) return false;
        
        try {
            await window.Clerk.openSignIn();
            return true;
        } catch (error) {
            console.error('Sign in error:', error);
            return false;
        }
    }
    
    async signOut() {
        if (!window.Clerk) return false;
        
        try {
            await window.Clerk.signOut();
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }
    
    getUserId() {
        return this.user?.id || null;
    }
    
    getUserName() {
        if (!this.user) return null;
        return this.user.firstName || this.user.username || this.user.emailAddresses[0]?.emailAddress || null;
    }
    
    getUserImage() {
        return this.user?.imageUrl || null;
    }
}

// Create and export a singleton instance
const auth = new Auth();
export default auth; 