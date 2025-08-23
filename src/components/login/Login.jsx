import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";
import "./login.css";

const Login = () => {
  const { fetchUserInfo } = useUserStore();
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [loading, setLoading] = useState(false);

  const handleAvatar = e => {
    if (e.target.files && e.target.files[0]) {
      setAvatar({
        file: e.target.files,
        url: URL.createObjectURL(e.target.files)
      });
    } else {
      setAvatar({ file: null, url: "" });
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    if (!username || !email || !password) {
      toast.error("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      let imgUrl = "";
      if (avatar.file) {
        imgUrl = await upload(avatar.file).catch(err => {
          toast.error(err.message);
          imgUrl = "";
        });
      }

      await setDoc(doc(db, "user", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      }, { merge: true });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      }, { merge: true });

      toast.success("Account created! You can login now!");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already registered. Try signing in instead.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    if (!email || !password) {
      toast.error("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      fetchUserInfo(res.user.uid);
      toast.success("Hello");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login'>
      <ToastContainer />
      <div className="item">
        <h2>Welcome Back,</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload an Image
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
          <input type="text" placeholder="Username" name="username" />
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
