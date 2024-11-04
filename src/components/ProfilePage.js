import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../css/ProfilePage.css';

function ProfilePage({ user, showToast }) {
    const [profile, setProfile] = useState({ name: '', bio: '', avatarUrl: '' });
    const [editMode, setEditMode] = useState(false);
    const [newFirstName, setNewFirstName] = useState('');
    const [newMiddleName, setNewMiddleName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newBio, setNewBio] = useState('');
    const [newAvatar, setNewAvatar] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user || !user.uid) {
                setError('User is not authenticated.');
                return;
            }

            try {
                const db = getFirestore();
                const profileDoc = await getDoc(doc(db, 'users', user.uid));
                if (profileDoc.exists()) {
                    const profileData = profileDoc.data();
                    setProfile(profileData);
                    setNewFirstName(profileData.firstName || '');
                    setNewMiddleName(profileData.middleName || '');
                    setNewLastName(profileData.lastName || '');
                    setNewBio(profileData.bio || '');
                } else {
                    setError('Profile document does not exist.');
                }
            } catch (err) {
                setError('Error fetching profile: ' + err.message);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('User is not authenticated.');
            return;
        }

        const db = getFirestore();
        const storage = getStorage();

        let updatedProfile = {
            firstName: newFirstName || profile.firstName,
            middleName: newMiddleName || profile.middleName,
            lastName: newLastName || profile.lastName,
            bio: newBio || profile.bio,
        };

        if (newAvatar) {
            try {
                const avatarRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(avatarRef, newAvatar);
                const avatarUrl = await getDownloadURL(avatarRef);
                updatedProfile.avatarUrl = avatarUrl;
            } catch (err) {
                setError('Error uploading avatar: ' + err.message);
                return;
            }
        }

        try {
            await updateDoc(doc(db, 'users', user.uid), updatedProfile);

            const userProgressRef = doc(db, 'userProgress', user.uid);
            const userProgressDoc = await getDoc(userProgressRef);
            if (!userProgressDoc.exists()) {
                await setDoc(userProgressRef, { recentActivity: [] });
            }

            await updateDoc(userProgressRef, {
                recentActivity: arrayUnion({
                    date: Timestamp.now().toDate().toLocaleString(),
                    activity: 'Profile edited'
                })
            });

            // Add achievement for completing the profile
            if (!profile.name || !profile.bio || !profile.avatarUrl) {
                await updateDoc(doc(db, 'users', user.uid), {
                    achievements: arrayUnion('complete_profile')
                });
            }

            setProfile(updatedProfile);
            setEditMode(false);
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            setError('Error updating profile: ' + err.message);
        }
    };

    if (error) return <div>Error: {error}</div>;
    if (!profile) return <div>Loading...</div>;

    return (
        <div className="profile-page">
            <h1>Profile</h1>
            {editMode ? (
                <form onSubmit={handleSubmit} className="profile-form">
                    <input
                        type="text"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="First Name"
                        required
                    />
                    <input
                        type="text"
                        value={newMiddleName}
                        onChange={(e) => setNewMiddleName(e.target.value)}
                        placeholder="Middle Name"
                    />
                    <input
                        type="text"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="Last Name"
                        required
                    />
                    <textarea
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Bio"
                    />
                    <input
                        type="file"
                        onChange={(e) => setNewAvatar(e.target.files[0])}
                        accept="image/*"
                    />
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditMode(false)}>Cancel</button>
                </form>
            ) : (
                <div className="profile-info">
                    <img src={profile.avatarUrl} alt="Profile" className="profile-avatar" />
                    <h2>{profile.firstName} {profile.middleName} {profile.lastName}</h2>
                    <p>{profile.bio}</p>
                    <p>Email: {user.email}</p>
                    <p>Level: {profile.isAdmin ? 'N/A' : profile.level}</p>
                    <button onClick={() => setEditMode(true)}>Edit Profile</button>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;
