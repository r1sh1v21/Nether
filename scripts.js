document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const feedSection = document.getElementById('feedSection');
    const myBlogsSection = document.getElementById('myBlogsSection');
    const friendsSection = document.getElementById('friendsSection');
    const discoverSection = document.getElementById('discoverSection');
    const navLinks = document.querySelectorAll('nav a');
    const username = document.getElementById('username');
    const profileUsername = document.getElementById('profileUsername');
    const blogForm = document.getElementById('blogForm');
    const blogsContainer = document.getElementById('blogsContainer');
    const myBlogsContainer = document.getElementById('myBlogsContainer');

    // Sample data (would be fetched from server in a real app)
    let currentUser = null;
    const users = [
        { id: 1, username: 'johndoe', email: 'john@example.com', password: 'password123', friends: [2, 3] },
        { id: 2, username: 'janedoe', email: 'jane@example.com', password: 'password123', friends: [1] },
        { id: 3, username: 'mikejones', email: 'mike@example.com', password: 'password123', friends: [1] }
    ];
    const blogs = [
        { id: 1, userId: 2, title: 'My Travel Adventure', content: 'Last month, I had the opportunity to visit Japan...', date: '2025-03-28', likes: 12, comments: 5 },
        { id: 2, userId: 3, title: 'New Tech Trends', content: 'The tech industry is evolving rapidly with AI...', date: '2025-04-01', likes: 8, comments: 3 },
        { id: 3, userId: 1, title: 'Cooking Tips', content: 'Here are some cooking tips I learned from my grandmother...', date: '2025-04-02', likes: 5, comments: 2 }
    ];

    // Event listeners
    loginBtn.addEventListener('click', () => {
        if (!currentUser) {
            hideAllSections();
            loginForm.style.display = 'block';
        }
    });

    registerBtn.addEventListener('click', () => {
        hideAllSections();
        registerForm.style.display = 'block';
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    logoutBtn.addEventListener('click', () => {
        logout();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const target = link.getAttribute('href').substring(1);
            showSection(target);
        });
    });

    document.querySelector('form', loginForm).addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('loginUsername').value;
        const passwordInput = document.getElementById('loginPassword').value;
        login(usernameInput, passwordInput);
    });

    document.querySelector('form', registerForm).addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('regUsername').value;
        const emailInput = document.getElementById('regEmail').value;
        const passwordInput = document.getElementById('regPassword').value;
        const confirmPasswordInput = document.getElementById('regConfirmPassword').value;
        
        if (passwordInput !== confirmPasswordInput) {
            alert("Passwords don't match!");
            return;
        }
        
        register(usernameInput, emailInput, passwordInput);
    });

    blogForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Please login to post a blog');
            return;
        }
        
        const title = document.getElementById('blogTitle').value;
        const content = document.getElementById('blogContent').value;
        
        if (!title || !content) {
            alert('Please fill in all fields');
            return;
        }
        
        createBlog(title, content);
    });

    // Functions
    function hideAllSections() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        feedSection.style.display = 'none';
        myBlogsSection.style.display = 'none';
        friendsSection.style.display = 'none';
        discoverSection.style.display = 'none';
    }

    function showSection(section) {
        hideAllSections();
        
        if (!currentUser && section !== 'feed') {
            loginForm.style.display = 'block';
            return;
        }
        
        switch(section) {
            case 'feed':
                loadFeed();
                feedSection.style.display = 'block';
                break;
            case 'myBlogs':
                loadMyBlogs();
                myBlogsSection.style.display = 'block';
                break;
            case 'friends':
                friendsSection.style.display = 'block';
                loadFriends();
                break;
            case 'discover':
                discoverSection.style.display = 'block';
                loadUsers();
                break;
            default:
                feedSection.style.display = 'block';
        }
    }

    function login(username, password) {
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            updateUserInterface();
            hideAllSections();
            loadFeed();
            feedSection.style.display = 'block';
        } else {
            alert('Invalid username or password');
        }
    }

    function register(username, email, password) {
        if (users.some(u => u.username === username)) {
            alert('Username already exists');
            return;
        }
        
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password,
            friends: []
        };
        
        users.push(newUser);
        currentUser = newUser;
        updateUserInterface();
        hideAllSections();
        loadFeed();
        feedSection.style.display = 'block';
    }

    function logout() {
        currentUser = null;
        updateUserInterface();
        hideAllSections();
        loadFeed();
        feedSection.style.display = 'block';
    }

    function updateUserInterface() {
        if (currentUser) {
            username.textContent = currentUser.username;
            profileUsername.textContent = currentUser.username;
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            document.getElementById('friendCount').textContent = currentUser.friends.length;
        } else {
            username.textContent = 'Guest';
            profileUsername.textContent = 'Guest';
            loginBtn.style.display = 'inline-block';
            registerBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            document.getElementById('friendCount').textContent = '0';
        }
    }

    function loadFeed() {
        blogsContainer.innerHTML = '';
        
        // If user is logged in, show their friends' blogs
        // Otherwise show all blogs
        let blogsToShow = blogs;
        
        if (currentUser) {
            blogsToShow = blogs.filter(blog => 
                blog.userId === currentUser.id || 
                currentUser.friends.includes(blog.userId)
            );
        }
        
        blogsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (blogsToShow.length === 0) {
            blogsContainer.innerHTML = '<p class="no-blogs">No blogs to show. Follow some friends or create your own blog!</p>';
            return;
        }
        
        blogsToShow.forEach(blog => {
            const author = users.find(u => u.id === blog.userId);
            const blogElement = createBlogElement(blog, author);
            blogsContainer.appendChild(blogElement);
        });
    }

    function loadMyBlogs() {
        if (!currentUser) return;
        
        myBlogsContainer.innerHTML = '';
        
        const myBlogs = blogs.filter(blog => blog.userId === currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
            
        if (myBlogs.length === 0) {
            myBlogsContainer.innerHTML = '<p class="no-blogs">You haven\'t written any blogs yet. Share your thoughts!</p>';
            return;
        }
        
        myBlogs.forEach(blog => {
            const blogElement = createBlogElement(blog, currentUser, true);
            myBlogsContainer.appendChild(blogElement);
        });
    }

    function loadFriends() {
        const friendsContainer = document.getElementById('friendsContainer');
        friendsContainer.innerHTML = '';
        
        if (!currentUser) return;
        
        const myFriends = users.filter(user => currentUser.friends.includes(user.id));
        
        if (myFriends.length === 0) {
            friendsContainer.innerHTML = '<p class="no-friends">You don\'t have any friends yet. Discover new users!</p>';
            return;
        }
        
        myFriends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-card';
            friendElement.innerHTML = `
                <div class="friend-pic">
                    <img src="/api/placeholder/50/50" alt="${friend.username}">
                </div>
                <div class="friend-info">
                    <h3>${friend.username}</h3>
                    <p>${friend.blogs ? friend.blogs.length : 0} blogs</p>
                </div>
                <div class="friend-actions">
                    <button class="unfriend-btn" data-id="${friend.id}">Unfriend</button>
                </div>
            `;
            friendsContainer.appendChild(friendElement);
        });
        
        // Add event listeners for unfriend buttons
        document.querySelectorAll('.unfriend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = parseInt(e.target.getAttribute('data-id'));
                unfriend(friendId);
            });
        });
    }

    function loadUsers() {
        const usersContainer = document.getElementById('usersContainer');
        usersContainer.innerHTML = '';
        
        if (!currentUser) return;
        
        const otherUsers = users.filter(user => 
            user.id !== currentUser.id && 
            !currentUser.friends.includes(user.id)
        );
        
        if (otherUsers.length === 0) {
            usersContainer.innerHTML = '<p class="no-users">No new users to discover!</p>';
            return;
        }
        
        otherUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-card';
            userElement.innerHTML = `
                <div class="user-pic">
                    <img src="/api/placeholder/50/50" alt="${user.username}">
                </div>
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>${user.blogs ? user.blogs.length : 0} blogs</p>
                </div>
                <div class="user-actions">
                    <button class="add-friend-btn" data-id="${user.id}">Add Friend</button>
                </div>
            `;
            usersContainer.appendChild(userElement);
        });
        
        // Add event listeners for add friend buttons
        document.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.getAttribute('data-id'));
                addFriend(userId);
            });
        });
    }

    function loadFriendSuggestions() {
        const suggestionsContainer = document.getElementById('friendSuggestions');
        suggestionsContainer.innerHTML = '';
        
        if (!currentUser) {
            suggestionsContainer.innerHTML = '<p>Log in to see suggestions</p>';
            return;
        }
        
        // Simple algorithm: suggest friends of friends who aren't already friends
        const friendsOfFriends = new Set();
        
        currentUser.friends.forEach(friendId => {
            const friend = users.find(u => u.id === friendId);
            if (friend && friend.friends) {
                friend.friends.forEach(fofId => {
                    if (fofId !== currentUser.id && !currentUser.friends.includes(fofId)) {
                        friendsOfFriends.add(fofId);
                    }
                });
            }
        });
        
        if (friendsOfFriends.size === 0) {
            // If no friends of friends, suggest some random users
            const suggestions = users.filter(u => 
                u.id !== currentUser.id && 
                !currentUser.friends.includes(u.id)
            ).slice(0, 3);
            
            suggestions.forEach(user => addSuggestionToDOM(user, suggestionsContainer));
        } else {
            Array.from(friendsOfFriends).slice(0, 3).forEach(id => {
                const user = users.find(u => u.id === id);
                if (user) {
                    addSuggestionToDOM(user, suggestionsContainer);
                }
            });
        }
    }

    function addSuggestionToDOM(user, container) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-card';
        suggestionElement.innerHTML = `
            <div class="suggestion-pic">
                <img src="/api/placeholder/40/40" alt="${user.username}">
            </div>
            <div class="suggestion-info">
                <p>${user.username}</p>
                <button class="add-friend-btn" data-id="${user.id}">Add</button>
            </div>
        `;
        container.appendChild(suggestionElement);
        suggestionElement.querySelector('.add-friend-btn').addEventListener('click', (e) => {
            const userId = parseInt(e.target.getAttribute('data-id'));
            addFriend(userId);
        });
    }

    function createBlogElement(blog, author, isOwner = false) {
        const blogElement = document.createElement('div');
        blogElement.className = 'blog-post';
        blogElement.innerHTML = `
            <div class="blog-header">
                <div class="blog-author-pic">
                    <img src="/api/placeholder/40/40" alt="${author.username}">
                </div>
                <div class="blog-info">
                    <h3>${author.username}</h3>
                    <span class="blog-date">${formatDate(blog.date)}</span>
                </div>
            </div>
            <div class="blog-content">
                <h2>${blog.title}</h2>
                <p>${blog.content}</p>
            </div>
            <div class="blog-actions">
                <button class="like-btn" data-id="${blog.id}">
                    <span>👍</span> ${blog.likes}
                </button>
                <button class="comment-btn" data-id="${blog.id}">
                    <span>💬</span> ${blog.comments}
                </button>
                ${isOwner ? `<button class="edit-btn" data-id="${blog.id}">Edit</button>
                <button class="delete-btn" data-id="${blog.id}">Delete</button>` : ''}
            </div>
        `;
        
        // Add event listeners
        const likeBtn = blogElement.querySelector('.like-btn');
        const commentBtn = blogElement.querySelector('.comment-btn');
        
        likeBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to like posts');
                return;
            }
            likeBlog(blog.id);
        });
        
        commentBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to comment');
                return;
            }
            // In a real app, this would open a comment form
            alert('Comment functionality coming soon!');
        });
        
        if (isOwner) {
            const editBtn = blogElement.querySelector('.edit-btn');
            const deleteBtn = blogElement.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => {
                editBlog(blog.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteBlog(blog.id);
            });
        }
        
        return blogElement;
    }

    function createBlog(title, content) {
        const newBlog = {
            id: blogs.length + 1,
            userId: currentUser.id,
            title,
            content,
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: 0
        };
        
        blogs.unshift(newBlog);
        
        // Clear form
        document.getElementById('blogTitle').value = '';
        document.getElementById('blogContent').value = '';
        
        // Reload feed
        loadFeed();
    }

    function likeBlog(blogId) {
        const blog = blogs.find(b => b.id === blogId);
        if (blog) {
            blog.likes++;
            loadFeed();
            if (myBlogsSection.style.display !== 'none') {
                loadMyBlogs();
            }
        }
    }

    function editBlog(blogId) {
        const blog = blogs.find(b => b.id === blogId);
        if (!blog || blog.userId !== currentUser.id) return;
        
        // In a real app, this would open an edit form
        // For this demo, we'll use prompt
        const newTitle = prompt('Edit title:', blog.title);
        if (newTitle === null) return;
        
        const newContent = prompt('Edit content:', blog.content);
        if (newContent === null) return;
        
        blog.title = newTitle;
        blog.content = newContent;
        blog.date = new Date().toISOString().split('T')[0]; // Update date
        
        loadFeed();
        loadMyBlogs();
    }

    function deleteBlog(blogId) {
        const blog = blogs.find(b => b.id === blogId);
        if (!blog || blog.userId !== currentUser.id) return;
        
        if (confirm('Are you sure you want to delete this blog?')) {
            const index = blogs.findIndex(b => b.id === blogId);
            if (index !== -1) {
                blogs.splice(index, 1);
                loadFeed();
                loadMyBlogs();
            }
        }
    }

    function addFriend(userId) {
        if (!currentUser) return;
        
        const userToAdd = users.find(u => u.id === userId);
        if (!userToAdd) return;
        
        if (!currentUser.friends.includes(userId)) {
            currentUser.friends.push(userId);
            // In a real app, you'd also update the friend's friends list
            const friend = users.find(u => u.id === userId);
            if (friend && !friend.friends.includes(currentUser.id)) {
                friend.friends.push(currentUser.id);
            }
            
            document.getElementById('friendCount').textContent = currentUser.friends.length;
            
            // Reload relevant sections
            if (discoverSection.style.display !== 'none') {
                loadUsers();
            }
            loadFriendSuggestions();
            loadFeed();
            
            alert(`You are now friends with ${userToAdd.username}`);
        }
    }

    function unfriend(friendId) {
        if (!currentUser) return;
        
        const friendIndex = currentUser.friends.indexOf(friendId);
        if (friendIndex !== -1) {
            currentUser.friends.splice(friendIndex, 1);
            
            // In a real app, you'd also update the friend's friends list
            const friend = users.find(u => u.id === friendId);
            if (friend) {
                const currentUserIndex = friend.friends.indexOf(currentUser.id);
                if (currentUserIndex !== -1) {
                    friend.friends.splice(currentUserIndex, 1);
                }
            }
            
            document.getElementById('friendCount').textContent = currentUser.friends.length;
            
            // Reload relevant sections
            loadFriends();
            loadUsers();
            loadFriendSuggestions();
            loadFeed();
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    // Initialize the app
    updateUserInterface();
    loadFeed();
    loadFriendSuggestions();
});