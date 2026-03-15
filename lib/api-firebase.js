import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "firebase/firestore";
import { auth, db } from "./firebase";

// Auth APIs (Replacing Django Auth)
export const authAPI = {
    register: async (userData) => {
        const { username, password, email, user_type } = userData;
        // Firebase Auth uses email, so we use email for creation
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional profile data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            user_type,
            created_at: new Date().toISOString()
        });

        // Initialize Shopkeeper/Dealer profile similarly to Django fix
        if (user_type === 'shopkeeper') {
            await setDoc(doc(db, "shopkeepers", user.uid), {
                user_id: user.uid,
                email: email,
                shop_name: `${username}'s Shop`
            });
        } else if (user_type === 'dealer') {
            await setDoc(doc(db, "dealers", user.uid), {
                user_id: user.uid,
                email: email,
                name: `${username}'s Agency`
            });
        }

        return user;
    },
    login: async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },
    logout: () => signOut(auth),
    getProfile: async () => {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    }
};

// Products APIs (Replacing Django Products)
export const productsAPI = {
    listProducts: async () => {
        const querySnapshot = await getDocs(collection(db, "products"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    // ... more methods would follow
};

export default { authAPI, productsAPI };
