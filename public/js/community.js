function toggleCalendar() {
    const calendar = document.getElementById("date_input");
    calendar.disabled = !calendar.disabled;
  }
  
function toggleCheckbox() {
    const checkbox = document.getElementById("no_date");
    const calendar = document.getElementById("date_input");
  
    if (calendar.value !== "") {
      checkbox.disabled = true;
    } else {
      checkbox.disabled = false;
    }
  }
  
function disableCheckbox() {
    document.querySelector("#no_date").disabled = true;
}
  
var now_utc = Date.now()
var timeOff = new Date().getTimezoneOffset()*60000;
var today = new Date(now_utc-timeOff).toISOString().split("T")[0];
document.getElementById("date_input").setAttribute("min", today);

const submitButton = document.getElementById("submit_button");
const titleInput = document.getElementById("title");
const numberInput = document.getElementById("people_num");
const selectInput = document.getElementById("purpose_list");
const dateInput = document.getElementById("date_input");
const checkboxInput = document.getElementById("no_date");
const contentInput = document.getElementById("content");
const errorMessage = document.getElementById("error_message");

function displayErrorMessage() {
  errorMessage.style.display = 'block';  
  setTimeout(() => {
    errorMessage.style.display = 'none';  
  }, 2000);
}

submitButton.addEventListener("click", function() {
  if (titleInput.value.trim() === "") {
    displayErrorMessage(); 
  }
  else if (numberInput.value === "") {
    displayErrorMessage(); 
  }
  else if (selectInput.value === "") {
    displayErrorMessage(); 
  }
  else if (contentInput.value.trim() === "") {
    displayErrorMessage(); 
  }
  else if (dateInput.value === "" && !checkboxInput.checked) {
    displayErrorMessage(); 
  }
  else if (dateInput.value === "" && checkboxInput.checked) {
    errorMessage.style.display = "none";
  }
});
