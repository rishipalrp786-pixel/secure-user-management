// Utility functions
function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading(button, show = true) {
    const text = button.querySelector('span:not(.loading)');
    const spinner = button.querySelector('.loading');
    
    if (show) {
        text.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;
    } else {
        text.style.display = 'inline';
        spinner.style.display = 'none';
        button.disabled = false;
    }
}

// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showAlert('Please enter both username and password');
                return;
            }
            
            showLoading(loginBtn, true);
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirectUrl;
                    }, 1000);
                } else {
                    showAlert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert('Network error. Please try again.');
            } finally {
                showLoading(loginBtn, false);
            }
        });
    }
});

// Dashboard functionality
function initializeDashboard() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Logout error:', error);
                showAlert('Logout failed. Please try again.');
            }
        });
    }
}

// User management functions
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
            displayUsers(data.users);
        } else {
            showAlert('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Error loading users');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function createUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    
    if (!username || !password) {
        showAlert('Please enter both username and password');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('User created successfully!', 'success');
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            loadUsers();
        } else {
            showAlert(data.error || 'Failed to create user');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert('Error creating user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('User deleted successfully!', 'success');
            loadUsers();
        } else {
            showAlert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user');
    }
}

// Data management functions
async function loadData() {
    try {
        const response = await fetch('/api/admin/data');
        const data = await response.json();
        
        if (data.success) {
            displayData(data.records);
        } else {
            showAlert('Failed to load data records');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Error loading data records');
    }
}

function displayData(records) {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    records.forEach(record => {
        const row = document.createElement('tr');
        const assignedUsers = record.assignedUsers ? record.assignedUsers.map(u => u.username).join(', ') : 'None';
        const statusClass = `status-${record.status.toLowerCase()}`;
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.name}</td>
            <td>${record.aadhaar_number}</td>
            <td>${record.srn}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
            <td>${record.receipt_filename ? 'Yes' : 'No'}</td>
            <td>${assignedUsers}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editRecord(${record.id})">Edit</button>
                    <button class="btn btn-success btn-sm" onclick="uploadReceipt(${record.id})">Upload</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function createRecord() {
    const name = document.getElementById('recordName').value.trim();
    const aadhaar = document.getElementById('recordAadhaar').value.trim();
    const srn = document.getElementById('recordSrn').value.trim();
    const status = document.getElementById('recordStatus').value;
    
    if (!name || !aadhaar || !srn) {
        showAlert('Please fill in all required fields');
        return;
    }
    
    if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
        showAlert('Aadhaar number must be exactly 12 digits');
        return;
    }
    
    // Get selected users
    const selectedUsers = Array.from(document.querySelectorAll('#userAccess input:checked')).map(cb => parseInt(cb.value));
    
    try {
        const response = await fetch('/api/admin/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                aadhaar_number: aadhaar,
                srn,
                status,
                assigned_users: selectedUsers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Record created successfully!', 'success');
            clearRecordForm();
            loadData();
        } else {
            showAlert(data.error || 'Failed to create record');
        }
    } catch (error) {
        console.error('Error creating record:', error);
        showAlert('Error creating record');
    }
}

function clearRecordForm() {
    document.getElementById('recordName').value = '';
    document.getElementById('recordAadhaar').value = '';
    document.getElementById('recordSrn').value = '';
    document.getElementById('recordStatus').value = 'Pending';
    document.querySelectorAll('#userAccess input:checked').forEach(cb => cb.checked = false);
}

async function deleteRecord(recordId) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/data/${recordId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Record deleted successfully!', 'success');
            loadData();
        } else {
            showAlert(data.error || 'Failed to delete record');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        showAlert('Error deleting record');
    }
}

// File upload functionality
function uploadReceipt(recordId) {
    const modal = document.getElementById('uploadModal');
    const form = document.getElementById('uploadForm');
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('receiptFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('Please select a file');
            return;
        }
        
        const formData = new FormData();
        formData.append('receipt', file);
        
        try {
            const response = await fetch(`/api/admin/data/${recordId}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Receipt uploaded successfully!', 'success');
                modal.style.display = 'none';
                fileInput.value = '';
                loadData();
            } else {
                showAlert(data.error || 'Failed to upload receipt');
            }
        } catch (error) {
            console.error('Error uploading receipt:', error);
            showAlert('Error uploading receipt');
        }
    };
    
    modal.style.display = 'block';
}

// Modal functionality
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// User dashboard functions
async function loadUserData() {
    try {
        const response = await fetch('/api/user/data');
        const data = await response.json();
        
        if (data.success) {
            displayUserData(data.records);
        } else {
            showAlert('Failed to load your data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('Error loading your data');
    }
}

function displayUserData(records) {
    const tbody = document.getElementById('userDataTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records assigned to you</td></tr>';
        return;
    }
    
    records.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = `status-${record.status.toLowerCase()}`;
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.name}</td>
            <td>${record.aadhaar_number}</td>
            <td>${record.srn}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
            <td>
                ${record.receipt_filename ? 
                    `<button class="btn btn-secondary btn-sm" onclick="downloadReceipt('${record.receipt_filename}')">Download</button>` : 
                    'No receipt'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function downloadReceipt(filename) {
    window.open(`/api/user/download/${filename}`, '_blank');
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminDashboard')) {
        initializeDashboard();
        loadUsers();
        loadData();
        loadUsersForAccess();
    } else if (document.getElementById('userDashboard')) {
        initializeDashboard();
        loadUserData();
    }
});

// Load users for access assignment
async function loadUsersForAccess() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('userAccess');
            if (container) {
                container.innerHTML = '';
                data.users.forEach(user => {
                    const label = document.createElement('label');
                    label.innerHTML = `
                        <input type="checkbox" value="${user.id}">
                        ${user.username}
                    `;
                    container.appendChild(label);
                });
            }
        }
    } catch (error) {
        console.error('Error loading users for access:', error);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}
