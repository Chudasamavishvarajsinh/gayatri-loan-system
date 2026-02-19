import { auth } from "./firebase-config.js";
import {
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth,(user)=>{
if(!user){
window.location.href="user-login.html";
}
});

window.logout = async function(){
await signOut(auth);
window.location.href="user-login.html";
};
