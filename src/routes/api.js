const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

router.post('/pages/save', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!req.body.title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const processedDots = (req.body.dots || []).map(dot => ({
            x: dot.x,
            y: dot.y,
            label: dot.label || '',
            coordinates: dot.coordinates || ''
        }));

        const page = new Page({
            title: req.body.title,
            content: req.body.content || req.body.title,
            author: req.user._id,
            dots: processedDots,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedPage = await page.save();

        res.status(200).json({ 
            pageId: savedPage._id,
            urlId: savedPage.urlId,
            username: req.user.username
        });

    } catch (error) {
        res.status(500).json({ error: 'Error saving page: ' + error.message });
    }
});

router.post('/pages/update/:urlId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { title, content } = req.body;

        const updatedPage = await Page.findOneAndUpdate(
            { 
                urlId: req.params.urlId,
                author: req.user._id
            },
            { 
                $set: { 
                    title: title,
                    content: content,
                    updatedAt: new Date()
                }
            },
            { 
                new: true,
                runValidators: false
            }
        );

        if (!updatedPage) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json({ 
            page: {
                title: updatedPage.title,
                urlId: updatedPage.urlId,
                updatedAt: updatedPage.updatedAt
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Error updating page: ' + error.message });
    }
});

router.put('/pages/:urlId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const page = await Page.findOne({ urlId: req.params.urlId });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (page.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const processedDots = (req.body.dots || []).map(dot => ({
            x: parseFloat(dot.x),
            y: parseFloat(dot.y),
            label: dot.label || '',
            coordinates: dot.coordinates || ''
        }));

        page.title = req.body.title || page.title;
        page.content = req.body.content || page.content;
        page.dots = processedDots;
        page.updatedAt = new Date();

        await page.save();

        res.json({ dots: page.dots });

    } catch (error) {
        res.status(500).json({ error: 'Error updating page: ' + error.message });
    }
});

router.post('/pages/update/:urlId/url', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { newUrlId } = req.body;
        
        if (!newUrlId || newUrlId.length < 3) {
            return res.status(400).json({ error: 'URL must be at least 3 characters long' });
        }

        const existingPage = await Page.findOne({ urlId: newUrlId });
        if (existingPage) {
            return res.status(400).json({ error: 'This URL is already in use' });
        }

        const page = await Page.findOneAndUpdate(
            { 
                urlId: req.params.urlId,
                author: req.user._id
            },
            { 
                $set: { 
                    urlId: newUrlId,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!page) {
            return res.status(404).json({ error: 'Page not found or unauthorized' });
        }

        res.json({ newUrlId: page.urlId });

    } catch (error) {
        res.status(500).json({ error: 'Error updating URL' });
    }
});

router.get('/pages/:urlId', async (req, res) => {
    try {
        const page = await Page.findOne({ urlId: req.params.urlId });
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json({
            title: page.title,
            content: page.content,
            dots: page.dots,
            author: page.author,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
        });

    } catch (error) {
        res.status(500).json({ error: 'Error fetching page' });
    }
});

router.delete('/pages/:urlId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const page = await Page.findOne({ urlId: req.params.urlId });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (page.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Page.deleteOne({ _id: page._id });
        
        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: 'Error deleting page: ' + error.message });
    }
});

router.get('/pages/:urlId/dots', async (req, res) => {
    try {
        const page = await Page.findOne({ urlId: req.params.urlId });
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json(page.dots || []);

    } catch (error) {
        res.status(500).json({ error: 'Error fetching dots' });
    }
});

router.post('/pages/:urlId/dots', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const page = await Page.findOne({ 
            urlId: req.params.urlId,
            author: req.user._id 
        });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const processedDots = (req.body.dots || []).map(dot => {
            const x = parseFloat(dot.x.replace(/px$/, ''));
            const y = parseFloat(dot.y.replace(/px$/, ''));

            if (isNaN(x) || isNaN(y)) {
                throw new Error('Invalid coordinate values');
            }

            return {
                x: x,
                y: y,
                coordinates: dot.coordinates || '',
                label: dot.label || ''
            };
        });

        const updatedPage = await Page.findOneAndUpdate(
            { _id: page._id },
            { 
                $set: { 
                    dots: processedDots,
                    updatedAt: new Date()
                }
            },
            { 
                new: true,
                runValidators: false
            }
        ).exec();

        if (!updatedPage) {
            throw new Error('Failed to update page');
        }

        res.json({ dots: updatedPage.dots });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;