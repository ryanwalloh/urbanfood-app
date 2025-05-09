
function openModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('log-in').style.display = 'block';
    document.getElementById('sign-up').style.display = 'block';
    document.getElementById('welcome-container').style.display = 'block';
    document.getElementById('term-condition').style.display = 'block';
}

function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('check-email-Modal').style.display = 'none';
    document.getElementById('password-Modal').style.display = 'none';
    document.getElementById('register-Modal').style.display = 'none';
}

function checkEmail() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('check-email-Modal').style.display = 'block';
    // document.getElementById('email').value = '';

}


function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}



function rider(){
    window.location.href = "soti_rider.html";
}



document.getElementById('be-a-rider').addEventListener('click', rider);

document.getElementById('login').addEventListener('click', openModal);
document.getElementById('signup').addEventListener('click', openModal);
document.getElementById('log-in').addEventListener('click', checkEmail);
document.getElementById('sign-up').addEventListener('click', checkEmail);
// document.getElementById('closeModalButton').addEventListener('click', closeModal);

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

let email;

document.getElementById('magicLinkForm').addEventListener('submit', function(e) {
    e.preventDefault();

    email = document.getElementById('email').value;
    const messageElement = document.getElementById('modalMessage');
    const loginPassword = document.getElementById('loginPassword');
    // const userEmail = email.value;
    const csrftoken = getCookie('csrftoken');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const sendMagicLinkBtn = document.getElementById('sendMagicLinkBtn')

    messageElement.innerText = "";
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    sendMagicLinkBtn.disabled = true;  // Optionally, disable the button to prevent multiple clicks
    loginPassword.style.display = 'block';
    fetch('/request-magic-link/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        loadingIndicator.style.display = 'none';  // Hide the loading indicator
        sendMagicLinkBtn.disabled = false;  // Re-enable the button
        if (data.message) {
            messageElement.innerHTML = 'Magic link sent successfully!<br>Click the link to securely log in.';
            messageElement.style.color = '#2c786c';  // Optional: visually differentiate success
            loginPassword.style.display = 'block';
        } else {
            messageElement.innerText = 'Error: ' + (data.error || 'Something went wrong.');
            messageElement.style.color = 'red';
        }
    })
    .catch(error => {
        loadingIndicator.style.display = 'none';  // Hide the loading indicator
        sendMagicLinkBtn.disabled = false;  // Re-enable the button
        messageElement.innerText = 'Something went wrong, please try again.';
        messageElement.style.color = 'red';
    });
});



function passwordModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('check-email-Modal').style.display = 'none';
    document.getElementById('password-Modal').style.display = 'block';
    document.getElementById('response-message').style.display = 'none';
    document.getElementById('modalMessage').style.display = 'none';
    document.getElementById('greetEmail').innerText = email;
}

document.getElementById('loginByPassword').addEventListener('submit', function(e) {
    e.preventDefault();

    const storeEmail = document.getElementById('emailVariable').value = 'email';
    password = document.getElementById('email').value;

});