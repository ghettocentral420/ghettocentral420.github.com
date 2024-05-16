function openPopup() {
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const transactionName = document.getElementById('transaction-name').value;
    const transactionAmount = parseFloat(document.getElementById('transaction-amount').value);
    
    addTransaction(transactionName, transactionAmount);
    
    closePopup();
});

function addTransaction(name, amount) {
    const transactionList = document.getElementById('transaction-list');
    
    const newTransaction = document.createElement('div');
    newTransaction.classList.add('transaction');
    
    const transactionDetails = document.createElement('div');
    transactionDetails.classList.add('transaction-details');
    
    const description = document.createElement('div');
    description.classList.add('description');
    description.textContent = name;
    
    const status = document.createElement('div');
    status.classList.add('status');
    status.textContent = 'Pending';
    
    transactionDetails.appendChild(description);
    transactionDetails.appendChild(status);
    
    const amountDiv = document.createElement('div');
    amountDiv.classList.add('amount');
    if (amount < 0) {
        amountDiv.textContent = `-$${Math.abs(amount).toFixed(2)}`;
        amountDiv.classList.add('negative');
    } else {
        amountDiv.textContent = `$${amount.toFixed(2)}`;
    }
    
    newTransaction.appendChild(transactionDetails);
    newTransaction.appendChild(amountDiv);
    
    newTransaction.addEventListener('click', function() {
        transactionList.removeChild(newTransaction);
    });
    
    transactionList.insertBefore(newTransaction, transactionList.firstChild);
}

// Add event listeners to existing transactions
document.querySelectorAll('.transaction').forEach(transaction => {
    transaction.addEventListener('click', function() {
        const transactionList = document.getElementById('transaction-list');
        transactionList.removeChild(transaction);
    });
});
