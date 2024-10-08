document.addEventListener('DOMContentLoaded',()=>{
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    //const viewTasks = document.getElementById('view-tasks')

    taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const taskId = document.getElementById('task-id').value;
      if (taskId) {
          updateTask(taskId);
      } else {
          addTask();
      }
  });

    /*viewTasks.addEventListener('click', ()=>{
      fetchTasks();
    })*/

    function addTask(){   //function for adding tasks
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const dueDate = document.getElementById('due-date').value;
        const priority = document.getElementById('priority').value;
        //const expirationDateTime = document.getElementById('expiration-date').value;

        fetch('/addTask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, dueDate, priority })
          }).then(response => response.json())
            .then(data => {
              const newTaskId = data.tasks[data.tasks.length - 1].id;
              const expirationDateTime = prompt("Set an expiration date and time for this task (YYYY-MM-DDTHH:MM format):");
              if (expirationDateTime) {
                saveExpiration(newTaskId, expirationDateTime);
              }
              renderTasks(data.tasks);
              taskForm.reset();
              confirmMessage('Task added succeessfully','success');
            });       
    }

    function renderTasks(tasks) {      // function for rendering tasks
      console.log('Rendering tasks:', tasks); // Log the tasks to be rendered
      taskList.innerHTML = '';
      const now = new Date();
      tasks.forEach(task => {
          const expirationDateTimeStr = getExpiration(task.id);
          const expirationDateTime = expirationDateTimeStr ? new Date(expirationDateTimeStr) : null;
          const isExpired = expirationDateTime && expirationDateTime < now;
          const taskElement = document.createElement('div');
          taskElement.className = `bg-white p-4 rounded shadow mb-4 ${isExpired ? 'bg-gray-400' : ''}`;
          taskElement.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Title : ${task.title}</h2>
            <p class="text-base text-gray-600 font-mono font-semibold">Description : ${task.description}</p>
            <p class="text-base text-gray-600 font-mono font-semibold">Due Date: ${task.due_date}</p>
            <p class="text-base text-gray-600 mb-5 font-mono font-semibold">Priority : ${task.priority}</p>
            ${expirationDateTime ? `<p class="text-base text-red-500 mb-5 font-mono font-semibold">Expires On : ${expirationDateTime.toLocaleString()}</p>` : ''}
            ${isExpired ? `<span class="bg-red-500 text-white px-2 py-1 rounded">Expired</span>` : ''}
            <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="editTask(${task.id})">Edit</button>
            <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteTask(${task.id})">Delete</button>
            ${task.completed ? `<span class="bg-green-500 text-white px-2 py-1 rounded">Completed</span>` : `<button class="bg-green-500 text-white px-2 py-1 rounded" onclick="markCompleted(${task.id})">Mark as Completed</button>`}
          `;
          taskList.appendChild(taskElement);
      });
    }

    function fetchTasks() {     // function for viewing tasks
      fetch('/tasks')
          .then(response => response.json())
          .then(data => {
            renderTasks(data.tasks);
            if (data.upcomingTasks && data.upcomingTasks.length > 0) {
                notifyUpcomingTasks(data.upcomingTasks);
            }
            })
          .catch(error => console.error('Error fetching tasks:', error));
    }
  
    fetchTasks();

    function notifyUpcomingTasks(upcomingTasks) {  // function for task notification
      upcomingTasks.forEach(task => {
          confirmMessage(`Reminder: Task "${task.title}" is due soon!`, 'warning');
      });
    }
  
    function deleteTask(id) {        // function for deleting tasks
      fetch('/deleteTask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
      })
      .then(response => response.json())
      .then(data => {
          renderTasks(data.tasks);
          confirmMessage('Task deleted successfully!', 'success');
      })
      .catch(error => 
        console.error('Error deleting task:', error));
        confirmMessage('Failed to delete task.', 'error');
    }
    window.deleteTask = deleteTask;

    function editTask(id){         // function for editing tasks
      fetch(`/task/${id}`).then(response=>response.json())
        .then(task=>{
            document.getElementById('task-id').value = task.id;
            document.getElementById('title').value = task.title;
            document.getElementById('description').value = task.description;
            document.getElementById('due-date').value = task.due_date;
            document.getElementById('priority').value = task.priority;

            document.getElementById('submit-btn').textContent = 'Update Task';
         })
         .catch(error => console.error('Error fetching task:', error));
    }
    window.editTask = editTask;

    function updateTask(id) {            // function for updating tasks
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const due_date = document.getElementById('due-date').value;
      const priority = document.getElementById('priority').value;
  
      fetch(`/updateTask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, title, description, due_date, priority })
      })
      .then(response => response.json())
      .then(data => {
          renderTasks(data.tasks);
          taskForm.reset();
          document.getElementById('task-id').value = ''; 
          document.getElementById('submit-btn').textContent = 'Add Task';
          confirmMessage('Task updated successfully!', 'success');
      });
    }

    function markCompleted(id) {        // function for task completion
      fetch('/markCompleted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
      })
      .then(response => response.json())
      .then(data => {
          renderTasks(data.tasks);
          confirmMessage('Task is completed!', 'success');
      })
      .catch(error => console.error('Error marking task as completed:', error));
    }
    window.markCompleted = markCompleted;

    function confirmMessage(messages, type='info'){       // function for notification messages
      const message = document.getElementById('confirmation');
      message.innerText = messages;

      switch(type){
        case 'success':
          message.className = 'fixed top-0 right-0 m-4 p-2 bg-green-500 text-white rounded shadow-lg';
          break;
        case 'error':
          message.className = 'fixed top-0 right-0 m-4 p-2 bg-red-500 text-white rounded shadow-lg';
          break;
        case 'warning':
          message.className = 'fixed top-0 right-0 m-4 p-2 bg-yellow-500 text-white rounded shadow-lg';
          break;
        default:
          message.className = 'fixed top-0 right-0 m-4 p-2 bg-blue-500 text-white rounded shadow-lg';
          break;
      }

      message.classList.remove('hidden');
      setTimeout(() => {
        message.classList.add('hidden');
      }, 3000);
    }

    function saveExpiration(taskId, expirationDateTime) {   // function to store expiration date and time
      if (expirationDateTime) {
          const expirationTimes = JSON.parse(localStorage.getItem('expirationTimes')) || {};
          expirationTimes[taskId] = expirationDateTime;
          localStorage.setItem('expirationTimes', JSON.stringify(expirationTimes));
      }
    }
  
    function getExpiration(taskId) {     // function to retrieve expiration date and time
      const expirationTimes = JSON.parse(localStorage.getItem('expirationTimes')) || {};
      return expirationTimes[taskId];
    }


    document.getElementById('search-btn').addEventListener('click', () => {
      const query = document.getElementById('search-query').value.trim();
      if(query){
        searchTasks(query);
      }
    });

    function searchTasks(query){  // function to search tasks
      fetch(`/searchTasks?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => renderTasks(data.tasks))
        .catch(error => console.error('Error searching tasks:', error));
    }

})