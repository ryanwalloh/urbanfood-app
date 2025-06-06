
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

document.getElementById('magicLinkForm').addEventListener('submit', function(e) {
    e.preventDefault();

    let email = document.getElementById('email').value;
    const messageElement = document.getElementById('modalMessage');
    // const userEmail = email.value;
    const csrftoken = getCookie('csrftoken');

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
        if (data.success) {
            messageElement.innerText = 'Check your email for the magic link!';
        } else {
            messageElement.innerText = 'Error: ' + data.error;
        }
    })
    .catch(error => {
        messageElement.innerText = 'Something went wrong, please try again.';
    });
});