const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleWare');
const {
  getJobApplicationDetails,
  submitApplication,
  getUserApplications,
  getApplicationDetails,
  updateApplication
} = require('../controllers/applicationController');

// Get job details for application page (includes token cost and user balance)
router.get('/job/:jobId/details', authenticate, getJobApplicationDetails);

// Submit job application with proposal
router.post('/job/:jobId/submit', authenticate, submitApplication);

// Get user's applications
router.get('/my', authenticate, getUserApplications);

// Get specific application details
router.get('/:applicationId', authenticate, getApplicationDetails);

// Update application (withdraw or edit proposal)
router.patch('/:applicationId', authenticate, updateApplication);

module.exports = router;
