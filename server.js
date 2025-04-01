const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database (in-memory for demo, use MongoDB/PostgreSQL in production)
let users = [];
let blogs = [];
let comments = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access denied' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// User routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user exists
        if (users.some(user => user.email === email || user.username === username)) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            friends: [],
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Create token
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/users', authenticateToken, (req, res) => {
    // Return all users except the current user
    const filteredUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        friends: user.friends
    })).filter(user => user.id !== req.user.id);
    
    res.json(filteredUsers);
});

app.get('/api/users/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        friends: user.friends,
        createdAt: user.createdAt
    });
});

app.post('/api/users/friends', authenticateToken, (req, res) => {
    const { friendId } = req.body;
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    const friend = users.find(u => u.id === friendId);
    if (!friend) {
        return res.status(404).json({ message: 'Friend not found' });
    }
    
    // Check if already friends
    if (user.friends.includes(friendId)) {
        return res.status(400).json({ message: 'Already friends' });
    }
    
    // Add friend
    user.friends.push(friendId);
    friend.friends.push(user.id);
    
    res.json({ message: 'Friend added successfully' });
});

app.delete('/api/users/friends/:friendId', authenticateToken, (req, res) => {
    const friendId = parseInt(req.params.friendId);
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove friend
    user.friends = user.friends.filter(id => id !== friendId);
    
    // Also remove from friend's list
    const friend = users.find(u => u.id === friendId);
    if (friend) {
        friend.friends = friend.friends.filter(id => id !== user.id);
    }
    
    res.json({ message: 'Friend removed successfully' });
});

// Blog routes
app.post('/api/blogs', authenticateToken, (req, res) => {
    try {
        const { title, content } = req.body;
        
        // Validation
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        
        // Create blog
        const newBlog = {
            id: blogs.length + 1,
            userId: req.user.id,
            title,
            content,
            likes: [],
            createdAt: new Date()
        };
        
        blogs.push(newBlog);
        
        res.status(201).json(newBlog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/blogs', (req, res) => {
    const allBlogs = blogs.map(blog => {
        const author = users.find(u => u.id === blog.userId);
        const blogComments = comments.filter(c => c.blogId === blog.id).length;
        
        return {
            id: blog.id,
            title: blog.title,
            content: blog.content,
            author: {
                id: author.id,
                username: author.username
            },
            likesCount: blog.likes.length,
            commentsCount: blogComments,
            createdAt: blog.createdAt
        };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(allBlogs);
});

app.get('/api/blogs/feed', authenticateToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get blogs from friends and the user
        const feedBlogs = blogs
            .filter(blog => blog.userId === user.id || user.friends.includes(blog.userId))
            .map(blog => {
                const author = users.find(u => u.id === blog.userId);
                const blogComments = comments.filter(c => c.blogId === blog.id).length;
                
                return {
                    id: blog.id,
                    title: blog.title,
                    content: blog.content,
                    author: {
                        id: author.id,
                        username: author.username
                    },
                    likesCount: blog.likes.length,
                    commentsCount: blogComments,
                    createdAt: blog.createdAt,
                    isLiked: blog.likes.includes(user.id)
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(feedBlogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/blogs/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    const userBlogs = blogs
        .filter(blog => blog.userId === userId)
        .map(blog => {
            const author = users.find(u => u.id === blog.userId);
            const blogComments = comments.filter(c => c.blogId === blog.id).length;
            
            return {
                id: blog.id,
                title: blog.title,
                content: blog.content,
                author: {
                    id: author.id,
                    username: author.username
                },
                likesCount: blog.likes.length,
                commentsCount: blogComments,
                createdAt: blog.createdAt
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(userBlogs);
});

app.get('/api/blogs/:blogId', (req, res) => {
    const blogId = parseInt(req.params.blogId);
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    
    const author = users.find(u => u.id === blog.userId);
    const blogComments = comments
        .filter(c => c.blogId === blog.id)
        .map(comment => {
            const commentAuthor = users.find(u => u.id === comment.userId);
            return {
                id: comment.id,
                content: comment.content,
                author: {
                    id: commentAuthor.id,
                    username: commentAuthor.username
                },
                createdAt: comment.createdAt
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        author: {
            id: author.id,
            username: author.username
        },
        likesCount: blog.likes.length,
        comments: blogComments,
        createdAt: blog.createdAt
    });
});

app.put('/api/blogs/:blogId', authenticateToken, (req, res) => {
    const blogId = parseInt(req.params.blogId);
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if user is the owner
    if (blog.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update blog
    const { title, content } = req.body;
    
    if (title) blog.title = title;
    if (content) blog.content = content;
    
    res.json({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        updatedAt: new Date()
    });
});

app.delete('/api/blogs/:blogId', authenticateToken, (req, res) => {
    const blogId = parseInt(req.params.blogId);
    const blogIndex = blogs.findIndex(b => b.id === blogId);
    
    if (blogIndex === -1) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if user is the owner
    if (blogs[blogIndex].userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete blog
    blogs.splice(blogIndex, 1);
    
    // Delete comments for this blog
    comments = comments.filter(c => c.blogId !== blogId);
    
    res.json({ message: 'Blog deleted successfully' });
});

app.post('/api/blogs/:blogId/like', authenticateToken, (req, res) => {
    const blogId = parseInt(req.params.blogId);
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if already liked
    if (blog.likes.includes(req.user.id)) {
        // Unlike
        blog.likes = blog.likes.filter(id => id !== req.user.id);
        return res.json({ message: 'Blog unliked successfully', likesCount: blog.likes.length });
    }
    
    // Like
    blog.likes.push(req.user.id);
    res.json({ message: 'Blog liked successfully', likesCount: blog.likes.length });
});

app.post('/api/blogs/:blogId/comments', authenticateToken, (req, res) => {
    const blogId = parseInt(req.params.blogId);
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }
    
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Create comment
    const newComment = {
        id: comments.length + 1,
        blogId,
        userId: req.user.id,
        content,
        createdAt: new Date()
    };
    
    comments.push(newComment);
    
    const author = users.find(u => u.id === req.user.id);
    
    res.status(201).json({
        id: newComment.id,
        content: newComment.content,
        author: {
            id: author.id,
            username: author.username
        },
        createdAt: newComment.createdAt
    });
});

// Serve React app in production
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});