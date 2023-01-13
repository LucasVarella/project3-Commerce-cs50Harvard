let origin = "";
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#back').addEventListener('click', () => load_mailbox(origin));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Catch values of a new e-mail when submit in compose-form
  document.querySelector('#compose-form').onsubmit = () =>{
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    let bodyContent = new String(body);
    while (bodyContent.includes('\n')){
      bodyContent = bodyContent.replace('\n','<br>');
    }

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: bodyContent
      })
    })
    .then(response => response.json())
    .then(result => {

        if (result.error){
          const msg = document.createElement('div');
          msg.setAttribute('id', 'msg');
          msg.classList.add('alert');
          msg.classList.add('alert-danger');
          msg.innerHTML = result.error;
          document.querySelector('#msg-error').append(msg);
          setTimeout(function(){ 
            msg.style.animationPlayState = 'running';
            msg.addEventListener('animationend', () =>{
              msg.remove();
            });
          }, 4000);

        }else{
          load_mailbox('sent');
        }
    });
    
    // Stop form from submitting
    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(e) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-open').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Check if it's not an reply
  if (e.recipients === undefined){
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    
  // Reply
  }else{
    document.querySelector('#compose-recipients').value = e.sender;

      if (e.subject.includes("Re:")){
        document.querySelector('#compose-subject').value = e.subject;
      }else{
        document.querySelector('#compose-subject').value = "Re: "+ e.subject;
      }
    
    let bodyContent = new String(e.body);
    bodyContent = bodyContent.trim();
    while (bodyContent.includes('<br>')){
      bodyContent = bodyContent.replace('<br>', '\n');
    }
    document.querySelector('#compose-body').value = "On "+e.timestamp+" "+e.sender+" wrote: \n"+bodyContent+"\n\n";
    document.querySelector('#compose-body').focus();
  }
}


function create_div_email(e, origin){ 

  const divEmail = document.createElement('div');
  divEmail.classList.add('div-email');
  const divUser = document.createElement('div');

  divArchive = document.createElement('div');
  
  // Div Mid
  const divMid = document.createElement('div');
  const spanSubject = document.createElement('span');
  spanSubject.innerHTML =  e.subject;
  spanSubject.style.fontWeight = 'bold';
  divMid.append(spanSubject);
  const spanBody = document.createElement('span');

  let bodyContent = new String(e.body);
  bodyContent = bodyContent.trim();
  while (bodyContent.includes('<br>')){
    bodyContent = bodyContent.replace('<br>', ' ');
  }

  spanBody.innerHTML =' - ' + bodyContent.substr(0,60)+"...";
  divMid.append(spanBody);

  const divDT = document.createElement('div');
  divDT.innerHTML = e.timestamp;
  divDT.classList.add('div-DT');

  if(e.read === true){
    divEmail.style.backgroundColor = 'whitesmoke';
  }

  if (origin === 'sent'){
    divUser.innerHTML = "to: " + e.recipients;
    
  //origin = inbox or archives
  }else{
    divUser.innerHTML = e.sender;

    divArchive.classList.add('btn');
    divArchive.classList.add('div-archive');
    divArchive.classList.add('hide');

    if (e.archived == false){
      divArchive.classList.add('btn-outline-danger');
    }else{
      divArchive.classList.add('btn-outline-success');
      divArchive.innerHTML = '';
    }
    
    imgArchive = document.createElement('img');
    imgArchive.classList.add('img-icon');
    if (origin === 'inbox'){
      imgArchive.setAttribute('src', '../../static/mail/imgs/archive.png');
    }else{
      imgArchive.setAttribute('src', '../../static/mail/imgs/unarchive.png');
    }
    divArchive.append(imgArchive);
  }

  divEmail.append(divUser);
  divEmail.append(divMid);
  divEmail.append(divDT);

  divEmail.addEventListener('click', function() {
    open_email(e);
  });

  const divBox = document.createElement('div');
  divBox.classList.add('div-box'); 

  divBox.append(divEmail);
  divBox.append(divArchive);
 
  divArchive.addEventListener('click', function() {
    archive_email(e);
    this.parentElement.style.animationPlayState = 'running';
    this.parentElement.addEventListener('animationend', () =>{
      this.parentElement.remove();
    })
  });

  document.querySelector('#emails-view').append(divBox);
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-open').style.display = 'none';
  document.querySelector('#back').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show Sent Page
  if (mailbox === 'sent'){
    origin = 'sent';
    fetch('/emails/sent')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(function(e){
        create_div_email(e, origin);
      }); 
    });
  }else{

    // Show Inbox Page
    if(mailbox === 'inbox'){
      origin = 'inbox';
      fetch('/emails/inbox')
      .then(response => response.json())
      .then(emails => {
        emails.forEach(function(e){
          create_div_email(e, origin);
        }); 
      });
    }else{

      // Show Archive Page
      origin = 'archive';
      fetch('/emails/archive')
      .then(response => response.json())
      .then(emails => {
        emails.forEach(function(e){
          create_div_email(e, origin);
        }); 
      });
    }
  }
}

function open_email(e){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-open').style.display = 'block';
  document.querySelector('#back').style.display = 'block';

  document.querySelector('#header-from').innerHTML = e.sender;
  document.querySelector('#header-to').innerHTML = e.recipients;
  document.querySelector('#header-subject').innerHTML = e.subject;
  document.querySelector('#header-timestamp').innerHTML = e.timestamp;

  let bodyContent = new String(e.body);
  document.querySelector('#body-email').innerHTML = bodyContent;

  fetch(`/emails/${e.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  
  document.querySelector('#reply').addEventListener('click', () =>{
    compose_email(e);
  });
}

function archive_email(e){
  
  if (e.archived === true){
    fetch(`/emails/${e.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  }else{
    fetch(`/emails/${e.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
  }
}
