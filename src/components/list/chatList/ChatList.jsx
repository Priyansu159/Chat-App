import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const unSub = onSnapshot(doc(db, "userChats", currentUser.id), async (res) => {
      const userChats = res.data()?.chats || []; // Safely access chats data

      const promises = userChats.map(async (item) => {
        try {
          const userDocRef = doc(db, "user", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.exists() ? userDocSnap.data() : null;

          return {
            ...item,
            user,
          };
        } catch (err) {
          console.error("Error fetching user data:", err);
          return item; // Return at least the chat data if user fetch fails
        }
      });

      const chatData = await Promise.all(promises);

      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt)); // Sort by updatedAt in descending order
      console.log("Fetched chats:", chatData);
    });

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userChats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      {/* Search Bar */}
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search icon" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt={addMode ? "Minus Icon" : "Plus Icon"}
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      {/* Chat List */}
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.user?.blocked?.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user?.avatar || "./avatar.png"
            }
            alt="User avatar"
          />
          <div className="texts">
            <span>
              {chat.user?.blocked?.includes(currentUser.id)
                ? "User"
                : chat.user?.username || "Unknown User"}
            </span>
            <p>{chat.lastMessage || "No messages yet"}</p>
          </div>
        </div>
      ))}

      {/* Add User Component */}
      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
