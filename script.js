document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('mechanicRegistrationForm');
    const formSteps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-step-btn');
    const prevButtons = document.querySelectorAll('.prev-step-btn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const formSubheading = document.getElementById('formSubheading');

    // Car Company Selection Elements (from original page 5)
    const carCompanySearchInput = document.getElementById('carCompanySearch');
    const carCompanyDropdown = document.getElementById('carCompanyDropdown');
    const selectedCarBrandsContainer = document.getElementById('selectedCarBrands');
    const hiddenCarCompaniesInput = document.getElementById('hiddenCarCompanies');

    // Custom Message Box Elements
    const messageBox = document.getElementById('messageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxCloseButton = document.getElementById('messageBoxClose');

    // Specific input field for Aadhaar/PAN
    const aadhaarPanInput = document.getElementById('aadhaarPan');

    // ID Proof Upload Elements
    const idProofUploadInput = document.getElementById('idProofUpload');
    const idProofPreview = document.getElementById('idProofPreview');
    const clickPhotoBtn = document.getElementById('clickPhotoBtn'); // Reference to the "Click Photo" button


    // Form State Variables
    let currentStep = 0; // Start at the first step (index 0)
    const totalSteps = formSteps.length;
    let allFormData = {}; // Object to store all form data

    // Car Company Data (from original page 5)
    const allCarCompanies = [
        'Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra', 'Honda', 'Toyota', 'Kia',
        'MG Motor', 'Renault', 'Skoda', 'Volkswagen', 'Nissan', 'Ford', 'Jeep',
        'Citroen', 'Audi', 'BMW', 'Mercedes-Benz', 'Volvo', 'Land Rover', 'Porsche',
        'Ferrari', 'Lamborghini', 'Rolls-Royce', 'Bentley', 'Aston Martin', 'Maserati',
        'Jaguar', 'Lexus', 'Mini', 'Datsun', 'Fiat', 'Mitsubishi', 'Chevrolet'
    ].sort();
    let selectedCarCompanies = new Set(); // Use a Set for efficient tracking of unique selected companies

    // **IMPORTANT**: Replace this with your deployed Google Apps Script Web App URL
    // This URL will be generated after you complete Part 3.
    const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyyyHGgj3xh3ihmT5SQ5PZ6sf3xJ08Lj7DlogL93JGvXMicDDqSJ6LJCov-upyTc2q-/exec';

    // --- Helper Functions ---

    /**
     * Displays a custom message box instead of alert().
     * @param {string} message - The message to display.
     * @param {function} [callback] - Optional callback function to execute when 'OK' is clicked.
     */
    function showMessageBox(message, callback = null) {
        messageBoxText.textContent = message;
        messageBox.classList.remove('hidden');

        // Clear previous event listener to prevent multiple triggers
        messageBoxCloseButton.onclick = null;

        messageBoxCloseButton.onclick = () => {
            messageBox.classList.add('hidden');
            if (callback) {
                callback();
            }
        };
    }

    /**
     * Updates the progress bar and text.
     */
    function updateProgress() {
        // Calculate progress percentage. For 5 steps, 0% at step 1, 100% at step 5.
        // (currentStep / (totalSteps - 1)) * 100 ensures 0% for first step, 100% for last.
        const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `Step ${currentStep + 1} of ${totalSteps}`;

        // Update subheading based on current step for better user guidance
        const subheadings = [
            'Step 1: Personal Details',
            'Step 2: Contact Information & Verification',
            'Step 3: Service Capabilities & Availability',
            'Step 4: Professional & Legal Details',
            'Step 5: Final Details & Terms'
        ];
        formSubheading.textContent = subheadings[currentStep];
    }

    /**
     * Shows a specific form step and hides all others.
     * @param {number} stepIndex - The index of the step to show (0-based).
     */
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.add('active'); // Add 'active' class to show
                step.classList.remove('hidden'); // Ensure it's visible
            } else {
                step.classList.remove('active'); // Remove 'active' class
                step.classList.add('hidden'); // Hide other steps
            }
        });
        currentStep = stepIndex; // Update global current step
        updateProgress(); // Update progress bar and text
        loadFormDataForCurrentStep(); // Load any previously saved data for the newly active step
    }

    /**
     * Saves data from the currently active step's fields into the global allFormData object
     * and then stores it in localStorage.
     */
    function saveFormData() {
        const currentFormStepElement = formSteps[currentStep];
        // Select all relevant input types within the current step
        const inputs = currentFormStepElement.querySelectorAll('input:not([type="file"]), select, textarea');
        const stepData = {};

        inputs.forEach(input => {
            const name = input.name;
            if (!name) return; // Skip inputs without a 'name' attribute

            if (input.type === 'checkbox') {
                // For checkboxes with the same 'name', collect all checked values into an array
                if (!stepData[name]) {
                    stepData[name] = [];
                }
                if (input.checked) {
                    stepData[name].push(input.value);
                }
            } else if (input.type === 'radio') {
                // For radio buttons, only save the value of the checked one
                if (input.checked) {
                    stepData[name] = input.value;
                }
            } else {
                // For other input types (text, email, number, date, tel, textarea, select)
                stepData[name] = input.value;
            }
        });

        // Special handling for selectedCarCompanies from Step 5 (index 4)
        if (currentStep === 4) {
            stepData.selectedCarCompanies = Array.from(selectedCarCompanies); // Convert Set to Array for storage
        }

        // Merge the current step's data into the overall form data object
        Object.assign(allFormData, stepData);
        // Save the entire form data object to localStorage
        localStorage.setItem('mechanicRegistrationData', JSON.stringify(allFormData));
    }

    /**
     * Loads saved data from localStorage into the fields of the currently active step.
     */
    function loadFormDataForCurrentStep() {
        const savedData = localStorage.getItem('mechanicRegistrationData');
        if (savedData) {
            allFormData = JSON.parse(savedData); // Parse the saved JSON back into an object
            const currentFormStepElement = formSteps[currentStep];
            // Select all relevant input types within the current step
            const inputs = currentFormStepElement.querySelectorAll('input:not([type="file"]), select, textarea');

            inputs.forEach(input => {
                const name = input.name;
                // Check if data for this input exists in the loaded form data
                if (!name || !allFormData.hasOwnProperty(name)) return;

                const value = allFormData[name]; // Get the saved value

                if (input.type === 'checkbox') {
                    // If the saved value is an array (for multi-select checkboxes), check if the input's value is in it
                    if (Array.isArray(value)) {
                        input.checked = value.includes(input.value);
                    }
                } else if (input.type === 'radio') {
                    // For radio buttons, check if the input's value matches the saved value
                    input.checked = (value === input.value);
                } else {
                    // For other input types, simply assign the value
                    input.value = value;
                }
            });

            // Special handling for selectedCarCompanies on Step 5 (index 4)
            if (currentStep === 4 && allFormData.selectedCarCompanies) {
                selectedCarCompanies = new Set(allFormData.selectedCarCompanies); // Restore Set from Array
                renderSelectedBrands(); // Re-render the display of selected brands
            }
        }
    }

    /**
     * Validates all required inputs within the current form step.
     * @returns {boolean} - True if all required fields are valid, false otherwise.
     */
    function validateCurrentStep() {
        const currentFormStepElement = formSteps[currentStep];
        // Select all elements that have the 'required' attribute
        const requiredInputs = currentFormStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            // checkValidity() is a native HTML5 validation method
            if (!input.checkValidity()) {
                isValid = false;
                // The browser will typically show a default validation message.
                // You could add custom visual feedback here if needed (e.g., add a red border).
            }
        });

        // Custom validation for terms & conditions checkboxes on the final step
        if (currentStep === 4) { // Assuming Step 5 is index 4
            const agreeTerms = document.getElementById('agreeTerms');
            const confirmAccuracy = document.getElementById('confirmAccuracy');
            if (!agreeTerms.checked || !confirmAccuracy.checked) {
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Attempts to move to the next step. Performs validation first.
     */
    function nextStep() {
        if (!validateCurrentStep()) {
            // If validation fails, show a custom message box.
            showMessageBox('Please fill in all required fields correctly before proceeding.');
            return; // Stop execution if validation fails
        }

        saveFormData(); // Save data before moving to the next step

        // Move to the next step if not on the last step
        if (currentStep < totalSteps - 1) {
            showStep(currentStep + 1);
        }
    }

    /**
     * Moves to the previous step.
     */
    function prevStep() {
        saveFormData(); // Save current data before navigating back
        // Move to the previous step if not on the first step
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    }

    // --- Event Listeners for Navigation Buttons ---
    nextButtons.forEach(button => {
        button.addEventListener('click', nextStep);
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', prevStep);
    });

    // --- Car Company Search and Selection Logic (Specific to Step 5) ---

    /**
     * Renders the dropdown list of car companies based on search term and selected companies.
     * @param {string} searchTerm - The text entered in the search input.
     */
    const renderDropdown = (searchTerm = '') => {
        carCompanyDropdown.innerHTML = ''; // Clear previous options
        const filteredCompanies = allCarCompanies.filter(company =>
            // Filter by search term (case-insensitive) and exclude already selected companies
            company.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedCarCompanies.has(company)
        );

        if (filteredCompanies.length > 0 && searchTerm.length > 0) {
            // If there are filtered companies and a search term, display the dropdown
            filteredCompanies.forEach(company => {
                const li = document.createElement('li');
                li.textContent = company;
                li.className = 'dropdown-item'; // For styling
                li.addEventListener('click', () => {
                    addCarCompany(company); // Add company when clicked
                    carCompanySearchInput.value = ''; // Clear search input
                    carCompanyDropdown.classList.add('hidden'); // Hide dropdown
                    renderDropdown(); // Re-render to clear search and update options
                });
                carCompanyDropdown.appendChild(li);
            });
            carCompanyDropdown.classList.remove('hidden'); // Show the dropdown
        } else {
            carCompanyDropdown.classList.add('hidden'); // Hide if no results or no search term
        }
    };

    /**
     * Adds a car company to the selected list.
     * @param {string} company - The name of the car company to add.
     */
    const addCarCompany = (company) => {
        if (!selectedCarCompanies.has(company)) { // Only add if not already present
            selectedCarCompanies.add(company);
            renderSelectedBrands(); // Update the visual display
            updateHiddenInput(); // Update the hidden input field for form submission
        }
    };

    /**
     * Removes a car company from the selected list.
     * @param {string} company - The name of the car company to remove.
     */
    const removeCarCompany = (company) => {
        selectedCarCompanies.delete(company); // Remove from the Set
        renderSelectedBrands(); // Update the visual display
        updateHiddenInput(); // Update the hidden input field
        renderDropdown(carCompanySearchInput.value); // Re-render dropdown to potentially show removed company
    };

    /**
     * Renders the selected car brands as interactive tags.
     */
    const renderSelectedBrands = () => {
        selectedCarBrandsContainer.innerHTML = ''; // Clear existing tags
        selectedCarCompanies.forEach(company => {
            const span = document.createElement('span');
            span.className = 'selected-tag'; // For styling
            // Use Font Awesome 'times-circle' icon for removal button
            span.innerHTML = `${company} <button type="button" class="remove-tag-btn" data-company="${company}"><i class="fas fa-times-circle"></i></button>`;
            selectedCarBrandsContainer.appendChild(span);
        });
    };

    /**
     * Updates the hidden input field with a JSON string of selected car companies.
     * This ensures the data is sent with the form submission.
     */
    const updateHiddenInput = () => {
        // Convert Set to Array and then to JSON string
        hiddenCarCompaniesInput.value = JSON.stringify(Array.from(selectedCarCompanies));
    };

    // Event listener for search input (only if element exists)
    if (carCompanySearchInput) {
        carCompanySearchInput.addEventListener('input', (e) => {
            renderDropdown(e.target.value);
        });
    }

    // Hide dropdown when clicking outside of the search input or dropdown itself
    document.addEventListener('click', (e) => {
        if (carCompanySearchInput && carCompanyDropdown &&
            !carCompanySearchInput.contains(e.target) && !carCompanyDropdown.contains(e.target)) {
            carCompanyDropdown.classList.add('hidden');
        }
    });

    // Event listener for removing selected brands (delegated to container)
    if (selectedCarBrandsContainer) {
        selectedCarBrandsContainer.addEventListener('click', (e) => {
            // Check if the clicked element or its parent is the remove button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                const company = e.target.closest('button').dataset.company;
                if (company) {
                    removeCarCompany(company);
                }
            }
        });
    }

    // --- Aadhaar/PAN Card Input Auto-Uppercase ---
    // Add an event listener to the aadhaarPanInput field to convert text to uppercase on input
    if (aadhaarPanInput) {
        aadhaarPanInput.addEventListener('input', (event) => {
            // Convert the input value to uppercase and assign it back to the input field
            event.target.value = event.target.value.toUpperCase();
        });
    }

    // --- ID Proof Upload Preview ---
    if (idProofUploadInput && clickPhotoBtn) { // Ensure both elements exist
        idProofUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; // Get the first selected file

            if (file) {
                // Check if the selected file is an image
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        // When the file is loaded, set the image source and show the preview
                        idProofPreview.src = e.target.result;
                        idProofPreview.classList.remove('hidden');
                    };

                    reader.onerror = () => {
                        console.error("Error reading file:", reader.error);
                        idProofPreview.classList.add('hidden'); // Hide preview on error
                        showMessageBox('Error loading image preview. Please try again.');
                    };

                    reader.readAsDataURL(file); // Read the file as a Data URL
                } else {
                    // If the file is not an image, hide the preview and inform the user
                    idProofPreview.src = '';
                    idProofPreview.classList.add('hidden');
                    showMessageBox('Selected file is not an image. Please select an image file (e.g., JPEG, PNG) for preview.');
                }
            } else {
                // If no file is selected (e.g., user clears the input), hide the preview
                idProofPreview.src = '';
                idProofPreview.classList.add('hidden');
            }
        });

        // Event listener for the "Click Photo" button
        clickPhotoBtn.addEventListener('click', () => {
            // Programmatically click the hidden file input to trigger camera/file selection
            idProofUploadInput.click();
        });
    }

    // --- Final Form Submission Logic ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the browser's default form submission

        if (!validateCurrentStep()) {
            showMessageBox('Please fill in all required fields correctly before submitting.');
            return;
        }

        saveFormData(); // Save data from the last step before final submission

        console.log('FINAL MECHANIC REGISTRATION DATA:', allFormData); // Log all data for debugging

        // Attempt to send data to the Google Apps Script web app
        try {
            const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // 'no-cors' is necessary when sending data to Apps Script web apps
                                 // This means you won't be able to read the response from Apps Script directly
                                 // in JavaScript due to CORS restrictions, but the request will still go through.
                headers: {
                    'Content-Type': 'application/json', // Indicate that the body is JSON
                },
                body: JSON.stringify(allFormData), // Send the collected data as a JSON string
            });

            // Since mode is 'no-cors', we can't check response.ok or parse response.json().
            // We assume success if the fetch operation itself doesn't throw an error.
            showMessageBox('Registration successful! Your data has been saved.', () => {
                // Actions to take after successful submission:
                localStorage.removeItem('mechanicRegistrationData'); // Clear saved data
                form.reset(); // Reset all form fields
                selectedCarCompanies.clear(); // Clear car companies Set
                renderSelectedBrands(); // Update selected brands display
                updateHiddenInput(); // Update hidden input
                showStep(0); // Go back to the first step of the form
            });

        } catch (error) {
            // Catch any network errors or issues with the fetch request
            console.error('Error submitting form to Google Sheet:', error);
            showMessageBox('Registration failed. Please try again later.');
        }
    });

    // --- Initialization on Page Load ---
    // Load any previously saved form data from localStorage when the page first loads
    const savedInitialData = localStorage.getItem('mechanicRegistrationData');
    if (savedInitialData) {
        allFormData = JSON.parse(savedInitialData);
    } else {
        allFormData = {}; // Initialize as an empty object if no data is found
    }

    // Display the first step of the form when the page loads
    showStep(0);
});
