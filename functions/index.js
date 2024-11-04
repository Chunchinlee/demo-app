const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    const userProgressRef = db.collection('userProgress').doc(user.uid);

    const userProgressData = {
        achievements: ['first_login', 'Firsthand FixMe Player'],
        avatarUrl: '',
        bio: '',
        createdAt: admin.firestore.Timestamp.now(),
        email: user.email,
        level: 1,
        name: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        recentActivity: [],
    };

    await userProgressRef.set(userProgressData);

    console.log(`User progress initialized for user: ${user.uid}`);
});

exports.deleteUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = data.uid;
    try {
        await admin.auth().deleteUser(uid);
        await admin.firestore().collection('users').doc(uid).delete();
        await admin.firestore().collection('userProgress').doc(uid).delete();
        return { message: 'User successfully deleted' };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});