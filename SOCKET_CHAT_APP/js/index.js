const baseURL = 'http://localhost:3000';

$("#login").click(() => {
    const email = $("#email").val()?.trim();
    const password = $("#password").val()?.trim();

    // تحقق من البيانات قبل الإرسال
    if (!email || !password) {
        alert("Email and password are required");
        return;
    }

    const data = { email, password };
    console.log("Sending login data:", data);

    axios({
        method: 'post',
        url: `${baseURL}/users/signin`,
        data: data,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    })
    .then(response => {
        console.log("Response:", response);
        const { message, AcsessToken } = response.data;

        if (message === "signIn Succissfully") {
            localStorage.setItem('token', AcsessToken);
            window.location.href = 'chat.html';
        } else {
            alert("Invalid email or password");
        }
    })
    .catch(error => {
        // عرض رسالة الخطأ من السيرفر إذا موجودة
        if (error.response && error.response.data) {
            console.log("Server error:", error.response.data);
            alert(error.response.data.message || "Login failed");
        } else {
            console.log("Axios error:", error);
            alert("Login failed due to network error");
        }
    });
});
