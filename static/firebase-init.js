// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUAqO7HqsX4nLxZKPd2kWwua4GV3-sSOo",
    authDomain: "plannerium-a59ab.firebaseapp.com",
    databaseURL: "https://plannerium-a59ab-default-rtdb.firebaseio.com",
    projectId: "plannerium-a59ab",
    storageBucket: "plannerium-a59ab.firebasestorage.app",
    messagingSenderId: "849023471090",
    appId: "1:849023471090:web:7349c67985451ed33faf6b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const database = firebase.database();

// Expose services globally if needed
window.auth = auth;
window.database = database;
