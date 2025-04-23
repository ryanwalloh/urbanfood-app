
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
    document.getElementById('type-email').value = '';

}


function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}


document.getElementById('emailForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    const emailInput = formData.get('email');

    if (!validateEmail(emailInput)) {
        document.getElementById('error-message').innerText = "Please enter a valid email address.";
        return;
    }

    fetch('check_email.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        closeModal(); 
        if (data.status === 'exists') {
            const email = data.email; 
            console.log(email);
            document.getElementById('pass-email').value = email;
            document.getElementById('password-Modal').style.display = 'block'; 
        } else {
            const email = data.email; 
            document.getElementById('email').value = email; 
            document.querySelector('.register-account-container p').innerHTML = 
                `First, let's create your SotiDelivery account with <strong>${email}</strong>`;
            document.getElementById('register-Modal').style.display = 'block'; 
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('error-message').innerText = "An error occurred. Please try again."; 
    });
});


document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);

    fetch('register_account.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = 'main-page/main-page.php'; 
        } else {
            document.getElementById('error-message').innerText = data.message; 
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('error-message').innerText = "An error occurred. Please try again.";
    });
});

document.getElementById('passwordForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    
    fetch('check_password.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            if (data.role === 'admin') {
                window.location.href = 'admin/admin.php';  // Redirect to admin page
            } else {
                // Redirect or show normal user content
                window.location.href = 'main-page/main-page.php';  // Example for regular user
            }
        } else {
            document.getElementById('error-message').innerText = data.message || "An error occurred. Please try again.";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('error-message').innerText = "An error occurred. Please try again."; 
    });
});

function rider(){
    window.location.href = "soti_rider.php";
}



document.getElementById('be-a-rider').addEventListener('click', rider);

document.getElementById('login').addEventListener('click', openModal);
document.getElementById('signup').addEventListener('click', openModal);
document.getElementById('log-in').addEventListener('click', checkEmail);
document.getElementById('sign-up').addEventListener('click', checkEmail);
document.getElementById('closeModalButton').addEventListener('click', closeModal);