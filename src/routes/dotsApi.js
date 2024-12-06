const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// GET route for fetching dots
router.get('/pages/:urlId/dots', async (req, res) => {
    try {
        console.log('GET request for dots - urlId:', req.params.urlId);
        
        const page = await Page.findOne({ urlId: req.params.urlId });
        if (!page) {
            console.log('Page not found:', req.params.urlId);
            return res.status(404).json({ error: 'Page not found' });
        }

        // Log the retrieved data
        console.log('GET dots - database data:', JSON.stringify(page.dots, null, 2));

        // Return dots array or empty array if none exist
        res.json(page.dots || []);
    } catch (error) {
        console.error('Error fetching dots:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message,
            type: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST route for saving dots
router.post('/pages/:urlId/dots', isAuthenticated, async (req, res) => {
  try {
      console.log('Incoming dots data:', JSON.stringify(req.body.dots, null, 2));

      const page = await Page.findOne({ 
          urlId: req.params.urlId,
          author: req.user._id 
      });

      if (!page) {
          return res.status(404).json({ error: 'Page not found' });
      }

      // Process dots with explicit handling of all properties
      const processedDots = req.body.dots.map((dot, index) => {
          // Convert any 'px' values to plain numbers
          const x = dot.x.replace ? dot.x.replace('px', '') : dot.x;
          const y = dot.y.replace ? dot.y.replace('px', '') : dot.y;

          // Ensure all required properties are present
          const processedDot = {
              x: String(x),
              y: String(y),
              coordinates: dot.coordinates,
              label: dot.label || '',
              id: dot.id || '',
              labelOffset: {
                  x: Number(dot.labelOffset?.x ?? 50),
                  y: Number(dot.labelOffset?.y ?? -50)
              },
              lineLength: Number(dot.lineLength),
              lineAngle: Number(dot.lineAngle)
          };

          console.log(`Processing dot ${index}:`, JSON.stringify(processedDot, null, 2));
          return processedDot;
      });

      // Update the page's dots
      page.dots = processedDots;

      // Save and verify the data
      console.log('Saving dots:', JSON.stringify(processedDots, null, 2));
      await page.save();

      // Return the complete saved data
      const savedDots = page.dots.map(dot => ({
          x: dot.x,
          y: dot.y,
          coordinates: dot.coordinates,
          label: dot.label,
          id: dot.id,
          labelOffset: {
              x: dot.labelOffset.x,
              y: dot.labelOffset.y
          },
          lineLength: dot.lineLength,
          lineAngle: dot.lineAngle
      }));

      console.log('Returning saved dots:', JSON.stringify(savedDots, null, 2));
      res.json({ dots: savedDots });

  } catch (error) {
      console.error('Error saving dots:', error);
      res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;