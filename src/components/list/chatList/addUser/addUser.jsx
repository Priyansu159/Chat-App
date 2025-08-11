import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "user");
      const q = query(userRef, where("username", "==", username));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userChats");
  
    try {
      // Create a new chat document
      const newChatRef = doc(chatRef);
  
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
  
      const timestamp = new Date().toISOString();
  
      // Helper function to ensure a userChats document exists
      const ensureUserChatDoc = async (userId) => {
        const userChatDocRef = doc(userChatsRef, userId);
        const docSnap = await getDoc(userChatDocRef);
        if (!docSnap.exists()) {
          await setDoc(userChatDocRef, { chats: [] });
        }
        return userChatDocRef;
      };
  
      // Ensure userChats documents exist for both users
      const currentUserChatDocRef = await ensureUserChatDoc(currentUser.id);
      const targetUserChatDocRef = await ensureUserChatDoc(user.id);
  
      // Update the chats array for both users
      await updateDoc(targetUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: timestamp,
        }),
      });
  
      await updateDoc(currentUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: timestamp,
        }),
      });
  
      console.log("User added to chat successfully!");
    } catch (err) {
      console.error("Error adding user to chat:", err);
    }
  };
  

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
