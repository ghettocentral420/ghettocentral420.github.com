let editEnabled = true;
let transactions = generateRandomTransactions(50);
let initialBalance = parseFloat(document.getElementById('main-balance').textContent.replace(/[^0-9.-]+/g, ""));

document.addEventListener('DOMContentLoaded', function() {
    // Display the top 3 pending transactions in the main transaction list
    const transactionList = document.getElementById('transaction-list');
    const pendingTransactions = transactions.filter(transaction => transaction.status === 'Pending').slice(0, 3);
    pendingTransactions.forEach(transaction => {
        transactionList.appendChild(createTransactionElement(transaction));
    });
});

function openPopup() {
    if (editEnabled) {
        document.getElementById('popup').style.display = 'block';
    }
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

function openBalancePopup() {
    if (editEnabled) {
        document.getElementById('balance-popup').style.display = 'block';
    }
}

function closeBalancePopup() {
    document.getElementById('balance-popup').style.display = 'none';
}

function openTransactionsPopup() {
    // Populate all-transactions-list with all transactions
    const allTransactionsList = document.getElementById('all-transactions-list');
    allTransactionsList.innerHTML = ''; // Clear previous content

    // Add "Pending" header
    const pendingHeader = document.createElement('div');
    pendingHeader.classList.add('date-header');
    pendingHeader.textContent = 'Pending';
    allTransactionsList.appendChild(pendingHeader);

    // Add pending transactions
    transactions.filter(transaction => transaction.status === 'Pending').forEach(transaction => {
        allTransactionsList.appendChild(createTransactionElement(transaction));
    });

    // Add date headers and non-pending transactions
    let lastDate = null;
    let runningBalance = initialBalance;
    transactions.filter(transaction => transaction.status === 'Posted').forEach(transaction => {
        if (transaction.date !== lastDate) {
            lastDate = transaction.date;
            const dateHeader = document.createElement('div');
            dateHeader.classList.add('date-header');
            dateHeader.textContent = lastDate;
            allTransactionsList.appendChild(dateHeader);
        }
        runningBalance -= transaction.amount;
        transaction.runningBalance = runningBalance.toFixed(2); // Update the transaction object with the running balance
        allTransactionsList.appendChild(createTransactionElement(transaction));
    });

    document.getElementById('transactions-popup').style.display = 'block';
}

function closeTransactionsPopup() {
    document.getElementById('transactions-popup').style.display = 'none';
}

document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const transactionName = document.getElementById('transaction-name').value;
    let transactionAmount = parseFloat(document.getElementById('transaction-amount').value);
    const transactionStatus = document.getElementById('transaction-status').checked ? 'Pending' : 'Posted';
    const transactionDate = formatDate(new Date()); // Use current date
    
    // Ensure the transaction amount is negative
    if (transactionAmount > 0) {
        transactionAmount = -transactionAmount;
    }
    
    addTransaction(transactionName, transactionAmount, transactionStatus, transactionDate);
    
    closePopup();
});

document.getElementById('balance-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    let newBalance = parseFloat(document.getElementById('new-balance').value).toFixed(2);
    newBalance = formatNumberWithCommas(newBalance);
    
    document.getElementById('main-balance').textContent = `$${newBalance}`;
    document.getElementById('available-balance').textContent = `$${newBalance}`;
    document.getElementById('present-balance').textContent = `$${newBalance}`;
    
    closeBalancePopup();
});

function addTransaction(name, amount, status, date) {
    const transactionList = document.getElementById('transaction-list');
    const allTransactionsList = document.getElementById('all-transactions-list');
    
    const newTransaction = createTransactionElement({name, amount, status, date});
    
    transactions.unshift({name, amount, status, date}); // Add to the beginning of the transactions array
    
    // Update the main transaction list (top 3 pending transactions)
    const pendingTransactions = transactions.filter(transaction => transaction.status === 'Pending').slice(0, 3);
    transactionList.innerHTML = '';
    pendingTransactions.forEach(transaction => {
        transactionList.appendChild(createTransactionElement(transaction));
    });
    
    // Update the full transaction list
    allTransactionsList.innerHTML = '';
    let lastDate = null;
    let runningBalance = initialBalance;

    // Add "Pending" header
    const pendingHeader = document.createElement('div');
    pendingHeader.classList.add('date-header');
    pendingHeader.textContent = 'Pending';
    allTransactionsList.appendChild(pendingHeader);

    // Add pending transactions
    transactions.filter(transaction => transaction.status === 'Pending').forEach(transaction => {
        allTransactionsList.appendChild(createTransactionElement(transaction));
    });

    // Add date headers and non-pending transactions
    transactions.filter(transaction => transaction.status === 'Posted').forEach(transaction => {
        if (transaction.date !== lastDate) {
            lastDate = transaction.date;
            const dateHeader = document.createElement('div');
            dateHeader.classList.add('date-header');
            dateHeader.textContent = lastDate;
            allTransactionsList.appendChild(dateHeader);
        }
        runningBalance -= transaction.amount;
        transaction.runningBalance = runningBalance.toFixed(2); // Update the transaction object with the running balance
        allTransactionsList.appendChild(createTransactionElement(transaction));
    });

    newTransaction.addEventListener('click', function() {
        if (editEnabled) {
            transactionList.removeChild(newTransaction);
        }
    });
}

function createTransactionElement(transaction) {
    const newTransaction = document.createElement('div');
    newTransaction.classList.add('transaction');
    
    const transactionDetails = document.createElement('div');
    transactionDetails.classList.add('transaction-details');
    
    const description = document.createElement('div');
    description.classList.add('description');
    description.textContent = transaction.name;
    
    const status = document.createElement('div');
    status.classList.add('status');
    status.textContent = transaction.status === 'Posted' ? `$${transaction.runningBalance}` : transaction.status;
    
    transactionDetails.appendChild(description);
    transactionDetails.appendChild(status);
    
    const amountDiv = document.createElement('div');
    amountDiv.classList.add('amount');
    if (transaction.amount < 0) {
        amountDiv.textContent = `-$${Math.abs(transaction.amount).toFixed(2)}`;
        amountDiv.classList.add('negative');
    } else {
        amountDiv.textContent = `$${transaction.amount.toFixed(2)}`;
    }
    
    newTransaction.appendChild(transactionDetails);
    newTransaction.appendChild(amountDiv);
    
    return newTransaction;
}

function formatNumberWithCommas(number) {
    const parts = number.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function toggleEdit() {
    editEnabled = !editEnabled;
    const toggleEditLabel = document.getElementById('toggle-edit-label');
    
    if (editEnabled) {
        toggleEditLabel.textContent = 'Transfer';
    } else {
        toggleEditLabel.textContent = 'Receive';
    }
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function generateRandomTransactions(count) {
    const transactions = [];
    const merchants = ["TARGET T-3575", "SMOKE MART", "PIZZA BAR", "DEATON LAWFIRM", "STEWIE'S", "MCDONALD'S", "LITTLE DARLINGS", "THE CLAM", "MORTY'S", "GOON WITH THE SPOON", "SUBWAY 3464", "ANTWON'S"];
    const locations = ["LAS VEGAS NV", "SUMMERLIN NV", "PHOENIX AZ", "LAS VEGAS", "LAS VEGAS NV", "LAS VEGAS NV"];
    const statuses = ["Pending", "Posted"];
    
    let currentDate = new Date();
    let pendingCount = 0;
    
    for (let i = 0; i < count; i++) {
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const amount = parseFloat((Math.random() * 95 + 5).toFixed(2)) * -1;
        let status;
        
        // Ensure no more than 3 pending transactions
        if (pendingCount >= 3) {
            status = "Posted";
        } else {
            status = statuses[Math.floor(Math.random() * statuses.length)];
            if (status === "Pending") {
                pendingCount++;
            }
        }
        
        const date = formatDate(new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000));
        transactions.push({
            name: `POS DEBIT ${merchant} ${location}`,
            amount: amount,
            status: status,
            date: date
        });
    }
    
    return transactions;
}

