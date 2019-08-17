const apiKey = '7147d9f48e9045b4a4594924e4294ad5';
const defaultSource = 'the-washington-post';
const sourceSelector = document.querySelector('#sources');
const main = document.querySelector('main');

// The click event on the pop up notification
document.getElementById('reload').addEventListener('click', function(){
  newWorker.postMessage({ action: 'skipWaiting' });
});


function showUpdateBar() {
  let snackbar = document.getElementById('snackbar');
  snackbar.className = 'show';
  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
  if (refreshing) return;
  window.location.reload();
  refreshing = true;
});
}

const urlB64ToUint8Array = base64String => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const saveSubscription = async subscription => {
  const SERVER_URL = "http://localhost:5000/save-subscription";
  const response = await fetch(SERVER_URL, {
    method: "post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
  return response.json();
};

async function subscribeUser() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(registration) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          'BJl2UO7gEhko9NIW9DS_H_9eqJhRlM5Jsd_JQw7fq2zehoB_IC74p2DAnK8Mti1u50yiO5IffXmRxdlWbP2vwr4'
        )
      };
  
      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(async function(pushSubscription) {
      // try {
      //   const response = await saveSubscription(pushSubscription);
      //   console.log(response);
      // } catch (err) {
      //   console.log("Error", err);
      // }
      console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
      return pushSubscription;
    });
  }
}

function displayNotification() {
  if (Notification.permission == 'granted') {
    navigator.serviceWorker.getRegistration().then(function(reg) {
      var options = {
        body: 'Welcome!',
        icon: './images/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        },
        actions: [
          {action: 'explore', title: 'Explore this new world',
            icon: './images/fetch-dog.jpg'},
          {action: 'close', title: 'Close notification',
            icon: './images/fetch-dog.jpg'},
        ]
      };
      reg.showNotification('Daily News!', options);
    });

  }else if (Notification.permission === "blocked") {
    askPermission();
   } else {
    console.log('Err');
   }
}
let newWorker;
(function() {
  if('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
     
      navigator.serviceWorker.register('./sw.js')
                  .then(function(registration) {
                  console.log('Service Worker Registered');
                  displayNotification();
                  return registration;
      })
      .catch(function(err) {
          console.error('Unable to register service worker.', err);
      });
      navigator.serviceWorker.ready.then(function(registration) {
          console.log('Service Worker Ready');
      });
      });
  }
  })();

function askPermission() {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.');
    }else{
      displayNotification();
      subscribeUser();
    }
  });
}

window.addEventListener('load', e => {
  sourceSelector.addEventListener('change', evt => updateNews(evt.target.value));
  updateNewsSources().then(() => {
    sourceSelector.value = defaultSource;
    updateNews();
  });
});

window.addEventListener('online', () => updateNews(sourceSelector.value));

async function updateNewsSources() {
  const response = await fetch(`https://newsapi.org/v2/sources?apiKey=${apiKey}`);
  const json = await response.json();
  sourceSelector.innerHTML =json.sources
    .map(source => `<option value="${source.id}">${source.name}</option>`)
    .join('\n');
}

async function updateNews(source= defaultSource) {
  const response = await fetch(`https://newsapi.org/v2/everything?q=${source}&apiKey=${apiKey}`);
  const json = await response.json();
  main.innerHTML = json.articles.map(createArticle).join('\n');
}

function createArticle(article) {
  return `
    <div class="article">
      <a href="${article.url}">
        <h2>${article.title}</h2>
        <img src="${article.urlToImage}" alt="${article.title}">
        <p>${article.description}</p>
      </a>
    </div>
  `;
}
