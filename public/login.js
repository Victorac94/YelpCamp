document.addEventListener("DOMContentLoaded", function(event) {
   const loginElements = document.querySelectorAll(".showLogin");
   const submit = document.getElementById("submitLogin");
   const loginModal = document.getElementById("loginModal");
   
   function loginPopUp() {
       loginModal.classList.toggle("visibleLogin");
   }
   
   loginElements.forEach((login) => {
      login.addEventListener("click", loginPopUp);
   });
   submit.addEventListener("click", loginPopUp);
   loginModal.addEventListener("click", (e) => {
       //When the login form is showing, if we click anywhere except on the form itself close the modal
       if(e.target == loginModal) {
           loginPopUp();
       }
   });
});