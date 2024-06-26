var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// categorize the tasks by their due date
var auditTask = function (taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();
  // ensure it worked
  console.log(date);

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17)

  // this should print out an object for the value of the date variable, but at 5:00pm of that date
  console.log("time is " + time);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
    console.log("task is late");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// editing tasks by clicking the <p> element
$(".list-group").on("click", "p", function () {
  var text = $(this)
  .text()
  .trim();

  var textInput = $('<textarea>')
  .addClass("form-control")
  .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus");
  // console.log(text);
});

// save task when clicking out of the text area form
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current value/text
  var text = $(this)
  .val()
  .trim();

  // get the parent ul's id attribute
  var status = $(this)
  .closest(".list-group")
  .attr("id") // attr method with one argument is used to get an attribute
  .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
  .closest(".list-group-item")
  .index();

  // update the tasks array with the new text input
  tasks[status][index].text = text;
  saveTasks(); 

  // recreate p element
  var taskP = $("<p>")
  .addClass("m-1")
  .text(text);

  // replace textarea form with p element
  $(this).replaceWith(taskP);
});

// editing due date by clicking it
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this)
  .text()
  .trim();

  // create new input element
  var dateInput = $("<input>")
  .attr("type", "text")
  .addClass("form-control")
  .val(date);

  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function () {
      // when calendar is closed, force a "change" event on the `dateInput`
      $(this).trigger("change");
    }
  });

  // automatically bring up the calendar
  dateInput.trigger("focus");
});

// save the new value of due date
$(".list-group").on("change", "input[type='text']", function(){
  // get current text
  var date = $(this)
  .val()
  .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();
  
  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
  .addClass("badge badge-primary badge-pill")
  .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});


// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// adds drag and drop functionality
$(".card .list-group").sortable({ // selects elements with the class .list-group within the class .card and makes it sortable with JQueryUI
  // connect with is a property of the sortable widget to define where these can be dropped
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function () {
    $(this).addClass("dropover");
    },
  deactivate: function () {
    $(this).removeClass("dropover");
    },
  over: function (event) {
    $(event.target).addClass("dropover-active");
    },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
    },
  update: function () {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function () {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

  // trim down list's ID to match object property
  var arrName = $(this)
    .attr("id") // reads the attribute "id" from the list
    .replace("list-", "");

  // update array on tasks object and save
  tasks[arrName] = tempArr;
  saveTasks();}
});

// makes the trash element a droppable widget
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    // console.log("drop");
    ui.draggable.remove();
  },
  over: function(event, ui) {
    // console.log("over");
  },
  out: function(event, ui) {
    // console.log("out");
  }
});

// adds the date picker calendar using JQuery UI
$("#modalDueDate").datepicker({
  minDate: 0 // this means the user can select any number of days from today
}); // select by the id #modalDueDate and implements the method

// repeats the auditTask function on every task <li> element every 30 minutes
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);


// load tasks for the first time
loadTasks();


