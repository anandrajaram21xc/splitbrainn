// load Google's JS API and setup the init function
google.load("gdata", "2.x");
google.setOnLoadCallback(main);


var contactsService = null;
var contactsServiceScope = 'https://www.google.com/m8/feeds';

/**
 * The init function that initializes everything
 */
function main() {
    var hdr = document.getElementById('header');

    if(google.accounts.user.checkLogin(contactsServiceScope)){
        // we're logged in already, create logout button
        var btn = document.createElement('button');
        btn.innerText = 'Switch Account';
        btn.onclick   = google.accounts.user.logout;
        hdr.innerHTML = '';
        hdr.appendChild(btn);

        // initialize the global contact service
        contactsService = new google.gdata.contacts.ContactsService('splitbrain.org-phonefix-1.0');

        // load the contacts
        loadContacts();
    }else{
        // make a login button
        var btn = document.createElement('button');
        btn.innerText = 'Logout';
        btn.onclick   = function(){
            var token = google.accounts.user.login(contactsServiceScope);
        };
        hdr.innerHTML = '';
        hdr.appendChild(btn);
    }
}

/**
 * Load all the contacts
 */
function loadContacts() {
    var contactsFeedUri = 'https://www.google.com/m8/feeds/contacts/default/full';
    var query = new google.gdata.contacts.ContactQuery(contactsFeedUri);

    // set a throbber
    var out = document.getElementById('output');
    out.innerHTML = '<img src="throbber.gif" />Loading contacts...';

    // FIXME set maximum
    query.setMaxResults(50);
    contactsService.getContactFeed(query, handleContacts, handleError);
}

/**
 * Callback for loadContacts
 *
 * Display the contact results.
 */
function handleContacts(result){
    var out = document.getElementById('output');
    out.innerHTML = '';

    var table = document.createElement('table');
    out.appendChild(table);

    var entries = result.feed.entry;
    for (var i = 0; i < entries.length; i++) {
        var contactEntry = entries[i];

        try {
            var name = contactEntry.getName().getFullName().getValue();
        }catch(err){
            continue; //skip entries without a name
        }

        var numbers = contactEntry.getPhoneNumbers();
        if(numbers.length == 0) continue; //skip entries without phone

        for (var j = 0; j < numbers.length; j++) {
            var th, tr, td, tx;

            tr = document.createElement('tr');

            th = document.createElement('th');
            th.innerText = name;
            tr.appendChild(th);

            td = document.createElement('td');
            td.innerText = numbers[j].getValue();
            tr.appendChild(td);

            td = document.createElement('td');
            tx = document.createElement('input');
            tx.value = phoneClean(numbers[j].getValue());
            // remember tree references in the DOM object
            tx.contactEntry = contactEntry;
            tx.phoneNumber  = numbers[j];
            td.appendChild(tx);
            tr.appendChild(td);

            table.appendChild(tr);

            console.dir(numbers[j]);
        }
    }
}

/**
 * Clean the given phone number
 */
function phoneClean(number){
    var prefix = '+49 ';

    number = number.replace(/[\.\-_]/g,' '); // spaces only
    number = number.replace(/  +/g,' ');     // single spaces only
    number = number.replace(/^00/,'+');      // 00 is the plus sign
    number = number.replace(/^0/,prefix);    // add prefix

    return number;
}

/**
 * Callback. Display an error
 */
function handleError(error){
    var out = document.getElementById('output');
    var err = document.createElement('div');
    err.className = 'error';
    err.innerText = error;
    out.appendChild(error);
}
