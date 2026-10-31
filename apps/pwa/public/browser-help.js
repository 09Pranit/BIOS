(function () {
  var root = document.getElementById('root');
  if (!root || root.querySelector('main')) return;
  var main = document.createElement('main');
  var title = document.createElement('h1');
  title.textContent = 'Open Smriva in an updated browser';
  var message = document.createElement('p');
  message.textContent =
    'Use Chrome, Edge, Firefox or Safari to open your encrypted workspace. Your saved records have not been changed.';
  var link = document.createElement('a');
  link.href = '/about';
  link.textContent = 'Read about Smriva';
  main.appendChild(title);
  main.appendChild(message);
  main.appendChild(link);
  root.appendChild(main);
})();
