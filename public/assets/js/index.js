var $addItemForm = document.querySelector('form.add-item')
var $itemsList = document.querySelector('.items .list')
var $clearButton = document.querySelector('[data-action="clear"]')
var $itemCount = document.querySelector('.item-count')


var countUp = 0;
var countDown = 0;

function onClickUp() {
    countUp += 1;
    document.getElementById("countUp").innerHTML = countUp;
    document.getElementById("input-countUp").value = countUp;
};

function onClickDown() {
    countDown += 1;
    document.getElementById("countDown").innerHTML = countDown;
    document.getElementById("input-countDown").value = countUp;
};

/**
 * With hoodie we're storing our data locally and it will stick around next time you reload.
 * This means each time the page loads we need to find any previous notes that we have stored.
 */
function loadAndRenderItems () {
  hoodie.store.findAll().then(render)
}

/* render items initially on page load */
loadAndRenderItems()

/**
 * Anytime there is a data change we reload and render the list of items
 */
hoodie.store.on('change', loadAndRenderItems)
hoodie.store.on('clear', function () {
  render([])
})

$clearButton.addEventListener('click', function () {
  hoodie.store.removeAll()
})

/**
 * If you submit a form it will emit a submit event.
 * This is better than listening for a click on the submit button for example.
 * It will catch you submitting via pressing 'enter' on a keyboard or something like 'Go' on a mobile keyboard.
 * More info on form accessibility: http://webaim.org/techniques/forms/
 **/
$addItemForm.addEventListener('submit', function (event) {
  /**
   * By default a form will submit your form data to the page itself,
   * this is useful if you're doing a traditional web app but we want to handle this in JavaScript instead.
   * if we're overriding this behaviour in JavaScript we need to grab the event
   * and prevent it from doing it's default behaviour.
   **/
  event.preventDefault()

  // Get values from inputs, then clear the form
  var countUp = $addItemForm.querySelector('[name=countUp]').value
  var countDown = $addItemForm.querySelector('[name=countDown]').value
  var note = $addItemForm.querySelector('[name=note]').value
  note = note.trim()
  $addItemForm.reset()

  hoodie.store.add({
    countUp: countUp,
    countDown: countDown,
    note: note
  });

  document.getElementById("countUp").innerHTML = 0;
  document.getElementById("countDown").innerHTML = 0;
})

/**
 * As items are dynamically added an removed, we cannot add event listeners
 * to the buttons. Instead, we register a click event on the items table and
 * then check if one of the buttons was clicked.
 * See: https://davidwalsh.name/event-delegate
 */
$itemsList.addEventListener('click', function (event) {
  event.preventDefault()

  var action = event.target.dataset.action
  if (!action) {
    return
  }

  var row = event.target.parentNode.parentNode
  var id = row.dataset.id
  var countUp = row.firstChild.nextSibling.nextSibling.textContent
  var countDown = row.firstChild.nextSibling.textContent
  var note = row.firstChild.textContent

  switch (action) {
    case 'edit':
      row.innerHTML = '<td><input type="text" name="note" value="' + escapeHtml(note) + '" data-reset-value="' + escapeHtml(note) + '"></td>' +
                      '<td><input type="number" name="Up" value="' + escapeHtml(countUp) + '" data-reset-value="' + escapeHtml(countUp) + '"></td>' +
                      '<td><input type="number" name="Down" value="' + escapeHtml(countDown) + '" data-reset-value="' + escapeHtml(countDown) + '"></td>' +
                      '<td><a href="#" data-action="update">Save</a></td><td><a href="#" data-action="cancel">Cancel</a></td>'
      // Only allow one item on list to be edited.   Remove edit option on other items in list while editing
      var elements = document.getElementsByClassName('edit')
      while (elements.length > 0) {
        elements[0].remove('edit')
      }
      break
    case 'cancel':
      loadAndRenderItems()
      break

    case 'remove':
      hoodie.store.remove(id)
      break
    case 'update':
      countUp = row.querySelector('input[name=countUp]').value
      countDown = row.querySelector('input[name=countDown]').value
      note = row.querySelector('input[name=note]').value
      hoodie.store.update(id, {
        countUp: countUp,
        countDown: countDown,
        note: note
      })
  }
})

function render (items) {
  $itemCount.classList.toggle('hide-item-count', items.length === 0)
  if (items.length === 0) {
    document.body.setAttribute('data-store-state', 'empty')
    return
  }

  document.body.setAttribute('data-store-state', 'not-empty')
  $itemsList.innerHTML = items
    .sort(orderByCreatedAt)
    .map(function (item) {
      return '<tr data-id="' + item._id + '">' +
             '<td>' + escapeHtml(item.note) + '</td>' +
             '<td>' + escapeHtml(item.countUp) + '</td>' +
             '<td>' + escapeHtml(item.countDown) + '</td>' +
             '<td><a class="edit" href="#" data-action="edit">Edit</a></td>' +
             '<td><a href="#" data-action="remove">Delete</a></td>' +
             '</tr>'
    }).join('')
  $itemCount.innerHTML = 'List Count: ' + items.length
}

function orderByCreatedAt (item1, item2) {
  var timeA = +new Date(item1.hoodie.createdAt)
  var timeB = +new Date(item2.hoodie.createdAt)
  return timeA < timeB ? 1 : -1
}

function escapeHtml (unsafeHtml) {
  var text = document.createTextNode(unsafeHtml)
  var div = document.createElement('div')
  div.appendChild(text)
  return div.innerHTML
}

/* global hoodie */
