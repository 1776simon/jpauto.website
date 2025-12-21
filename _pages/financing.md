---
layout: default
title: Financing
subtitle: Get Pre-Approved for Your Next Vehicle
description: Apply for auto financing at JP AUTO. Get pre-approved in minutes with our simple online application.
permalink: /financing/
---

<div class="bg-white">
  <!-- Page Header -->
  <div class="bg-gradient-to-r from-primary to-primary-dark py-12">
    <div class="container mx-auto px-4 text-center text-white">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">Get Pre-Approved Today</h1>
      <p class="text-lg md:text-xl">Fast, Easy, and Secure Online Application</p>
    </div>
  </div>

  <!-- Breadcrumb -->
  <div class="bg-gray-100 py-3">
    <div class="container mx-auto px-4">
      <nav class="text-sm">
        <a href="/" class="text-gray-600 hover:text-primary">Home</a>
        <span class="mx-2 text-gray-400">/</span>
        <span class="text-gray-900">Financing</span>
      </nav>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1 text-center step-indicator" data-step="1">
            <div class="w-10 h-10 mx-auto rounded-full bg-primary text-white flex items-center justify-center font-bold mb-2">1</div>
            <p class="text-xs md:text-sm font-semibold">Personal Info</p>
          </div>
          <div class="flex-1 border-t-2 border-gray-300 mx-2 -mt-8"></div>
          <div class="flex-1 text-center step-indicator" data-step="2">
            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">2</div>
            <p class="text-xs md:text-sm">Residence</p>
          </div>
          <div class="flex-1 border-t-2 border-gray-300 mx-2 -mt-8"></div>
          <div class="flex-1 text-center step-indicator" data-step="3">
            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">3</div>
            <p class="text-xs md:text-sm">Employment</p>
          </div>
          <div class="flex-1 border-t-2 border-gray-300 mx-2 -mt-8 co-applicant-step hidden"></div>
          <div class="flex-1 text-center step-indicator co-applicant-step hidden" data-step="4">
            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2">4</div>
            <p class="text-xs md:text-sm">Co-Applicant</p>
          </div>
          <div class="flex-1 border-t-2 border-gray-300 mx-2 -mt-8"></div>
          <div class="flex-1 text-center step-indicator" data-step="5">
            <div class="w-10 h-10 mx-auto rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold mb-2"><span class="final-step-num">4</span></div>
            <p class="text-xs md:text-sm">Vehicle</p>
          </div>
        </div>
      </div>

      <!-- Form Container -->
      <div class="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <form id="financing-form">

          <!-- Step 1: Personal Information -->
          <div class="form-step active" data-step="1">
            <h2 class="text-2xl font-bold mb-6">Step 1: Personal Information</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">First Name *</label>
                <input type="text" name="firstName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Middle Initial</label>
                <input type="text" name="middleInitial" maxlength="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Last Name *</label>
                <input type="text" name="lastName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Suffix</label>
                <select name="suffix" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="Jr">Jr.</option>
                  <option value="Sr">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Mobile Number *</label>
                <input type="tel" name="mobileNumber" required placeholder="(555) 555-5555" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Email *</label>
                <input type="email" name="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Social Security Number *</label>
                <input type="text" name="ssn" required placeholder="XXX-XX-XXXX" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Driver's License Number *</label>
                <input type="text" name="driversLicense" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">State *</label>
                <select name="state" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select State...</option>
                  <option value="CA">California</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Birth Date *</label>
                <input type="date" name="birthDate" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="mb-6">
              <label class="flex items-start">
                <input type="checkbox" id="hasCoApplicant" name="hasCoApplicant" class="mt-1 mr-2">
                <span class="text-sm">I am filing with a Co-Applicant</span>
              </label>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <label class="flex items-start">
                <input type="checkbox" name="termsAgreed" required class="mt-1 mr-2">
                <span class="text-xs text-gray-700">I have read and agree to the Terms & Conditions. I certify that all statements in this application are true and made for the purpose of obtaining credit. I authorize JP AUTO to investigate my credit and employment history and to answer questions about their credit experience with me. *</span>
              </label>
            </div>
          </div>

          <!-- Step 2: Current Residence -->
          <div class="form-step" data-step="2">
            <h2 class="text-2xl font-bold mb-6">Step 2: Current Residence</h2>

            <h3 class="text-lg font-semibold mb-4">Current Address</h3>
            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">Address *</label>
              <input type="text" name="currentAddress" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Apt/Unit</label>
                <input type="text" name="currentApt" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">City *</label>
                <input type="text" name="currentCity" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">State *</label>
                <select name="currentState" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select State...</option>
                  <option value="CA">California</option>
                  <!-- All states same as above -->
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Zip Code *</label>
                <input type="text" name="currentZip" required pattern="[0-9]{5}" placeholder="12345" title="Please enter a valid 5-digit zip code" maxlength="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Status *</label>
                <select name="residenceStatus" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="Rent">Rent</option>
                  <option value="Own">Own</option>
                  <option value="Own Free And Clear">Own Free And Clear</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Monthly Payment *</label>
                <input type="number" name="monthlyPayment" required placeholder="$" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Years at Residence *</label>
                <input type="number" name="yearsAtResidence" required min="0" max="50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Months *</label>
                <input type="number" name="monthsAtResidence" required min="0" max="11" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <h3 class="text-lg font-semibold mb-4 mt-8">Previous Address (if less than 2 years at current)</h3>
            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">Address</label>
              <input type="text" name="previousAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">City</label>
                <input type="text" name="previousCity" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">State</label>
                <select name="previousState" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select State...</option>
                  <option value="CA">California</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Zip Code</label>
                <input type="text" name="previousZip" pattern="[0-9]{5}" placeholder="12345" title="Please enter a valid 5-digit zip code" maxlength="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Years at Previous Residence</label>
                <input type="number" name="yearsAtPreviousResidence" min="0" max="50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Months</label>
                <input type="number" name="monthsAtPreviousResidence" min="0" max="11" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>
          </div>

          <!-- Step 3: Current Employment -->
          <div class="form-step" data-step="3">
            <h2 class="text-2xl font-bold mb-6">Step 3: Current Employment</h2>

            <h3 class="text-lg font-semibold mb-4">Current Employer</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Company Name *</label>
                <input type="text" name="companyName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Employer Phone *</label>
                <input type="tel" name="employerPhone" required placeholder="(555) 555-5555" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">Job Title *</label>
              <input type="text" name="jobTitle" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Years at Company *</label>
                <input type="number" name="yearsAtCompany" required min="0" max="50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Months *</label>
                <input type="number" name="monthsAtCompany" required min="0" max="11" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Gross Monthly Income *</label>
                <input type="number" name="grossMonthlyIncome" required placeholder="$" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <h3 class="text-lg font-semibold mb-4 mt-8">Previous Employment (if less than 2 years at current)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Company Name</label>
                <input type="text" name="previousCompanyName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Employer Phone</label>
                <input type="tel" name="previousEmployerPhone" placeholder="(555) 555-5555" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Job Title</label>
                <input type="text" name="previousJobTitle" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Years at Company</label>
                <input type="number" name="yearsAtPreviousCompany" min="0" max="50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>
          </div>

          <!-- Step 4: Co-Applicant (Conditional) -->
          <div class="form-step co-applicant-section" data-step="4">
            <h2 class="text-2xl font-bold mb-6">Step 4: Co-Applicant Information</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">First Name *</label>
                <input type="text" name="coFirstName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Middle Initial</label>
                <input type="text" name="coMiddleInitial" maxlength="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Last Name *</label>
                <input type="text" name="coLastName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Suffix</label>
                <select name="coSuffix" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="Jr">Jr.</option>
                  <option value="Sr">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Mobile Number *</label>
                <input type="tel" name="coMobileNumber" placeholder="(555) 555-5555" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Email *</label>
                <input type="email" name="coEmail" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Social Security Number *</label>
                <input type="text" name="coSsn" placeholder="XXX-XX-XXXX" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Driver's License Number *</label>
                <input type="text" name="coDriversLicense" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">State *</label>
                <select name="coState" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
                  <option value="">Select State...</option>
                  <option value="CA">California</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Birth Date *</label>
                <input type="date" name="coBirthDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
            </div>

            <div class="mb-6">
              <label class="flex items-start">
                <input type="checkbox" id="sameResidence" name="sameResidence" class="mt-1 mr-2">
                <span class="text-sm">My co-applicant's residence information is the same as mine</span>
              </label>
            </div>

            <!-- Co-Applicant Residence (conditional) -->
            <div id="coApplicantResidence" class="mb-6">
              <h3 class="text-lg font-semibold mb-4">Co-Applicant Current Residence</h3>
              <div class="mb-4">
                <label class="block text-sm font-semibold mb-2">Address *</label>
                <input type="text" name="coCurrentAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-semibold mb-2">City *</label>
                  <input type="text" name="coCurrentCity" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2">State *</label>
                  <select name="coCurrentState" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
                    <option value="">Select State...</option>
                    <option value="CA">California</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2">Zip Code *</label>
                  <input type="text" name="coCurrentZip" pattern="[0-9]{5}" placeholder="12345" title="Please enter a valid 5-digit zip code" maxlength="5" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
                </div>
              </div>
            </div>

            <!-- Co-Applicant Employment -->
            <h3 class="text-lg font-semibold mb-4 mt-8">Co-Applicant Current Employment</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-semibold mb-2">Company Name *</label>
                <input type="text" name="coCompanyName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Employer Phone *</label>
                <input type="tel" name="coEmployerPhone" placeholder="(555) 555-5555" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">Job Title *</label>
              <input type="text" name="coJobTitle" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Years at Company *</label>
                <input type="number" name="coYearsAtCompany" min="0" max="50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Months *</label>
                <input type="number" name="coMonthsAtCompany" min="0" max="11" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Gross Monthly Income *</label>
                <input type="number" name="coGrossMonthlyIncome" placeholder="$" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
              </div>
            </div>
          </div>

          <!-- Step 5: Vehicle Selection -->
          <div class="form-step" data-step="5">
            <h2 class="text-2xl font-bold mb-6"><span class="final-step-text">Step 4</span>: Choose Vehicle</h2>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Left: Filters -->
              <div class="lg:col-span-2">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label class="block text-sm font-semibold mb-2">Year</label>
                    <select name="vehicleYear" id="vehicleYear" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Year</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Make</label>
                    <select name="vehicleMake" id="vehicleMake" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Make</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2">Model</label>
                    <select name="vehicleModel" id="vehicleModel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Model</option>
                    </select>
                  </div>
                </div>

                <button type="button" id="resetVehicleSearch" class="mb-4 text-sm text-gray-600 hover:text-primary">Reset Search</button>

                <!-- Vehicle List -->
                <div id="vehicleList" class="space-y-3 max-h-96 overflow-y-auto">
                  <!-- Will be populated by JavaScript -->
                </div>

                <div id="noVehiclesMessage" class="hidden text-center py-8 text-gray-500">
                  No vehicles match your search criteria.
                </div>

                <div class="mt-6">
                  <label class="block text-sm font-semibold mb-2">Down Payment ($) <span class="text-red-500">*</span></label>
                  <input type="number" name="downPayment" id="downPayment" required placeholder="Enter down payment amount" min="0" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div class="mt-6">
                  <label class="block text-sm font-semibold mb-2">Additional Comments</label>
                  <textarea name="comments" id="comments" rows="4" placeholder="Any additional information you'd like to share..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
              </div>

              <!-- Right: Selected Vehicle Preview -->
              <div class="lg:col-span-1">
                <div class="bg-gray-50 rounded-lg p-4 sticky top-4">
                  <h3 class="text-lg font-semibold mb-4">Selected Vehicle</h3>
                  <div id="selectedVehiclePreview" class="text-center text-gray-500">
                    <p class="mb-2">No vehicle selected</p>
                    <p class="text-sm">Select a vehicle from the list</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 6: Review Information -->
          <div class="form-step" data-step="6">
            <h2 class="text-2xl font-bold mb-6">Review Your Information</h2>

            <!-- Personal Information Summary -->
            <div class="bg-white border rounded-lg p-6 mb-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Personal Information</h3>
                <button type="button" class="edit-btn text-primary hover:text-primary-dark font-semibold" data-step="1">Edit</button>
              </div>
              <div id="reviewPersonal" class="grid grid-cols-2 gap-4 text-sm"></div>
            </div>

            <!-- Residence Summary -->
            <div class="bg-white border rounded-lg p-6 mb-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Residence Information</h3>
                <button type="button" class="edit-btn text-primary hover:text-primary-dark font-semibold" data-step="2">Edit</button>
              </div>
              <div id="reviewResidence" class="grid grid-cols-2 gap-4 text-sm"></div>
            </div>

            <!-- Employment Summary -->
            <div class="bg-white border rounded-lg p-6 mb-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Employment Information</h3>
                <button type="button" class="edit-btn text-primary hover:text-primary-dark font-semibold" data-step="3">Edit</button>
              </div>
              <div id="reviewEmployment" class="grid grid-cols-2 gap-4 text-sm"></div>
            </div>

            <!-- Co-Applicant Summary (if applicable) -->
            <div id="reviewCoApplicantSection" class="bg-white border rounded-lg p-6 mb-4 hidden">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Co-Applicant Information</h3>
                <button type="button" class="edit-btn text-primary hover:text-primary-dark font-semibold" data-step="4">Edit</button>
              </div>
              <div id="reviewCoApplicant" class="grid grid-cols-2 gap-4 text-sm"></div>
            </div>

            <!-- Vehicle Summary -->
            <div class="bg-white border rounded-lg p-6 mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Vehicle Selection</h3>
                <button type="button" class="edit-btn text-primary hover:text-primary-dark font-semibold" data-step="5">Edit</button>
              </div>
              <div id="reviewVehicle" class="grid grid-cols-2 gap-4 text-sm"></div>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <p class="text-sm text-blue-900">
                By clicking Submit, I authorize JP AUTO and its affiliates to contact me via phone, text, and email regarding this application. I also authorize JP AUTO to forward my application to lenders and financial institutions to obtain financing.
              </p>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8">
            <button type="button" id="prevBtn" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold hidden">
              &lt; Back
            </button>
            <button type="button" id="nextBtn" class="ml-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold">
              Next &gt;
            </button>
            <button type="button" id="reviewBtn" class="ml-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold hidden">
              Review Information &gt;
            </button>
            <button type="submit" id="submitBtn" class="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold hidden">
              Submit Application &gt;
            </button>
          </div>

        </form>
      </div>

      <!-- Success Message -->
      <div id="successMessage" class="hidden bg-green-50 border border-green-200 rounded-lg p-8 text-center mt-8">
        <div class="text-6xl mb-4">✓</div>
        <h2 class="text-3xl font-bold text-green-800 mb-2">Application Submitted!</h2>
        <p class="text-lg text-green-700 mb-4">Thank you for applying for financing with JP AUTO.</p>
        <p class="text-gray-700 mb-6">Our financing team will review your application and contact you within 1-2 business days.</p>
        <a href="/inventory" class="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold">
          Browse Our Inventory
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Multi-Step Form JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  let currentStep = 1;
  let hasCoApplicant = false;
  const totalSteps = 5;

  // Get all vehicle data for dropdowns
  const vehicleDataItems = document.querySelectorAll('.vehicle-data-item');

  const formSteps = document.querySelectorAll('.form-step');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const hasCoApplicantCheckbox = document.getElementById('hasCoApplicant');
  const sameResidenceCheckbox = document.getElementById('sameResidence');
  const form = document.getElementById('financing-form');

  // Add active class styling first
  const style = document.createElement('style');
  style.textContent = `
    .form-step { display: none !important; }
    .form-step.active { display: block !important; }
  `;
  document.head.appendChild(style);

  // Define functions
  function showStep(step) {
    // Hide all steps
    formSteps.forEach(s => s.classList.remove('active'));

    // Show current step
    const actualStep = hasCoApplicant ? step : (step === 5 ? 5 : step);
    const stepElement = document.querySelector(`.form-step[data-step="${actualStep}"]`);
    if (stepElement) {
      stepElement.classList.add('active');
    }

    // Update buttons (basic visibility, override function handles specifics)
    prevBtn.classList.toggle('hidden', step === 1);

    // Show Next button by default (override function will hide it when needed)
    nextBtn.classList.remove('hidden');

    // Update progress indicators
    updateStepIndicators();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepIndicators() {
    stepIndicators.forEach((indicator, index) => {
      const indicatorStep = parseInt(indicator.dataset.step);
      const circle = indicator.querySelector('div');
      const text = indicator.querySelector('p');

      // Skip step 4 if no co-applicant
      if (indicatorStep === 4 && !hasCoApplicant) {
        return;
      }

      if (indicatorStep < currentStep || (indicatorStep === 4 && currentStep === 5 && !hasCoApplicant)) {
        circle.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white');
        circle.classList.add('bg-green-500', 'text-white');
        text.classList.remove('text-gray-600');
        text.classList.add('text-green-600', 'font-semibold');
      } else if (indicatorStep === currentStep) {
        circle.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
        circle.classList.add('bg-primary', 'text-white');
        text.classList.remove('text-gray-600', 'text-green-600');
        text.classList.add('font-semibold');
      } else {
        circle.classList.remove('bg-primary', 'text-white', 'bg-green-500');
        circle.classList.add('bg-gray-300', 'text-gray-600');
        text.classList.remove('font-semibold', 'text-green-600');
        text.classList.add('text-gray-600');
      }
    });
  }

  function updateFinalStepLabels() {
    const finalStepNum = hasCoApplicant ? '5' : '4';
    document.querySelectorAll('.final-step-num').forEach(el => {
      el.textContent = finalStepNum;
    });
    document.querySelectorAll('.final-step-text').forEach(el => {
      el.textContent = `Step ${finalStepNum}`;
    });
  }

  function validateStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"].active`);
    if (!stepElement) return true;

    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;
    let errorMessage = '';

    requiredFields.forEach(field => {
      // Skip disabled fields
      if (field.disabled) return;

      // Check if field is empty
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('border-red-500');
        errorMessage = 'Please fill in all required fields.';

        // Remove error styling on input
        field.addEventListener('input', function() {
          this.classList.remove('border-red-500');
        }, { once: true });
      }
      // Check pattern validation (for zip codes, etc.)
      else if (field.pattern && !new RegExp(field.pattern).test(field.value)) {
        isValid = false;
        field.classList.add('border-red-500');
        const fieldTitle = field.getAttribute('title') || 'Please enter a valid value.';
        errorMessage = fieldTitle;

        // Remove error styling on input
        field.addEventListener('input', function() {
          this.classList.remove('border-red-500');
        }, { once: true });
      }
      else {
        field.classList.remove('border-red-500');
      }
    });

    if (!isValid && errorMessage) {
      alert(errorMessage);
    }

    return isValid;
  }

  // Initialize
  showStep(1);

  // Co-applicant toggle
  hasCoApplicantCheckbox.addEventListener('change', function() {
    hasCoApplicant = this.checked;
    updateStepIndicators();
    updateFinalStepLabels();

    // Show/hide co-applicant fields
    document.querySelectorAll('.co-applicant-step').forEach(el => {
      el.classList.toggle('hidden', !hasCoApplicant);
    });

    // Update required fields
    document.querySelectorAll('.co-applicant-field').forEach(field => {
      field.required = hasCoApplicant;
    });
  });

  // Same residence checkbox
  sameResidenceCheckbox.addEventListener('change', function() {
    const coResidenceSection = document.getElementById('coApplicantResidence');
    const coResidenceFields = coResidenceSection.querySelectorAll('input, select');

    if (this.checked) {
      coResidenceSection.style.opacity = '0.5';
      coResidenceFields.forEach(field => {
        field.disabled = true;
        field.required = false;
      });
    } else {
      coResidenceSection.style.opacity = '1';
      coResidenceFields.forEach(field => {
        field.disabled = false;
        if (field.classList.contains('co-applicant-field')) {
          field.required = hasCoApplicant;
        }
      });
    }
  });

  // Navigation
  nextBtn.addEventListener('click', function() {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && hasCoApplicant) {
        currentStep = 4;
      } else if (currentStep === 3 && !hasCoApplicant) {
        currentStep = 5;
      } else if (currentStep < totalSteps) {
        currentStep++;
      }
      showStep(currentStep);
    }
  });

  prevBtn.addEventListener('click', function() {
    if (currentStep === 5 && hasCoApplicant) {
      currentStep = 4;
    } else if (currentStep === 5 && !hasCoApplicant) {
      currentStep = 3;
    } else if (currentStep > 1) {
      currentStep--;
    }
    showStep(currentStep);
  });

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (validateStep(currentStep)) {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting... <span class="inline-block animate-spin">⏳</span>';

      try {
        // Collect form data
        const formData = new FormData(form);
        const applicationData = Object.fromEntries(formData);

        // Add selected vehicle data if available
        if (selectedVehicleData) {
          applicationData.selectedVehicle = selectedVehicleData;
        }

        // Send to backend API
        const response = await fetch('https://jp-auto-inventory-production.up.railway.app/api/financing/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(applicationData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Hide form and show success message
          const formContainer = document.querySelector('.max-w-4xl > .bg-white');
          const successMessage = document.getElementById('successMessage');

          formContainer.style.display = 'none';
          successMessage.classList.remove('hidden');

          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error(result.error || 'Submission failed');
        }

      } catch (error) {
        console.error('Error submitting application:', error);
        alert('There was an error submitting your application. Please try again or call us at (916) 618-7197.');

        // Reset submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application &gt;';
      }
    }
  });

  // ======================
  // VEHICLE FILTER SYSTEM
  // ======================

  let selectedVehicleData = null;
  let allVehicles = [];
  const vehicleYearSelect = document.getElementById('vehicleYear');
  const vehicleMakeSelect = document.getElementById('vehicleMake');
  const vehicleModelSelect = document.getElementById('vehicleModel');
  const vehicleList = document.getElementById('vehicleList');
  const selectedVehiclePreview = document.getElementById('selectedVehiclePreview');
  const noVehiclesMessage = document.getElementById('noVehiclesMessage');
  const resetVehicleSearch = document.getElementById('resetVehicleSearch');
  const reviewBtn = document.getElementById('reviewBtn');

  // Parse vehicle data
  vehicleDataItems.forEach(item => {
    allVehicles.push({
      year: item.dataset.year,
      make: item.dataset.make,
      model: item.dataset.model,
      trim: item.dataset.trim || '',
      price: parseFloat(item.dataset.price) || 0,
      mileage: parseInt(item.dataset.mileage) || 0,
      transmission: item.dataset.transmission || '',
      fuelType: item.dataset.fuelType || '',
      image: item.dataset.image || '',
      url: item.dataset.url || ''
    });
  });

  // Populate initial filters with counts
  function populateVehicleFilters() {
    const filters = getCurrentFilters();
    const filteredVehicles = filterVehicles(filters);

    // Populate Year
    const years = {};
    filteredVehicles.forEach(v => {
      years[v.year] = (years[v.year] || 0) + 1;
    });

    vehicleYearSelect.innerHTML = '<option value="">Year</option>';
    Object.keys(years).sort((a, b) => b - a).forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `${year} (${years[year]})`;
      if (filters.year === year) option.selected = true;
      vehicleYearSelect.appendChild(option);
    });

    // Populate Make
    const makes = {};
    filteredVehicles.forEach(v => {
      makes[v.make] = (makes[v.make] || 0) + 1;
    });

    vehicleMakeSelect.innerHTML = '<option value="">Make</option>';
    Object.keys(makes).sort().forEach(make => {
      const option = document.createElement('option');
      option.value = make;
      option.textContent = `${make} (${makes[make]})`;
      if (filters.make === make) option.selected = true;
      vehicleMakeSelect.appendChild(option);
    });

    // Populate Model
    const models = {};
    filteredVehicles.forEach(v => {
      models[v.model] = (models[v.model] || 0) + 1;
    });

    vehicleModelSelect.innerHTML = '<option value="">Model</option>';
    Object.keys(models).sort().forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = `${model} (${models[model]})`;
      if (filters.model === model) option.selected = true;
      vehicleModelSelect.appendChild(option);
    });

    displayVehicleList(filteredVehicles);
  }

  function getCurrentFilters() {
    return {
      year: vehicleYearSelect.value,
      make: vehicleMakeSelect.value,
      model: vehicleModelSelect.value
    };
  }

  function filterVehicles(filters) {
    return allVehicles.filter(v => {
      if (filters.year && v.year !== filters.year) return false;
      if (filters.make && v.make !== filters.make) return false;
      if (filters.model && v.model !== filters.model) return false;
      return true;
    });
  }

  function displayVehicleList(vehicles) {
    if (vehicles.length === 0) {
      vehicleList.classList.add('hidden');
      noVehiclesMessage.classList.remove('hidden');
      return;
    }

    vehicleList.classList.remove('hidden');
    noVehiclesMessage.classList.add('hidden');

    vehicleList.innerHTML = vehicles.map((v, index) => `
      <div class="vehicle-item border rounded-lg p-4 cursor-pointer hover:border-primary transition ${selectedVehicleData && selectedVehicleData.year === v.year && selectedVehicleData.make === v.make && selectedVehicleData.model === v.model && selectedVehicleData.trim === v.trim ? 'border-primary bg-primary/5' : ''}"
           data-index="${index}">
        <div class="flex gap-4">
          <div class="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
            ${v.image ? `<img src="${v.image}" alt="${v.year} ${v.make} ${v.model}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">🚗</div>'}
          </div>
          <div class="flex-1">
            <h4 class="font-semibold">${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}</h4>
            <p class="text-primary font-bold">$${v.price.toLocaleString()}</p>
            <p class="text-sm text-gray-600">${(v.mileage / 1000).toFixed(0)}K miles • ${v.transmission}</p>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    vehicleList.querySelectorAll('.vehicle-item').forEach((item, index) => {
      item.addEventListener('click', () => selectVehicle(vehicles[index]));
    });
  }

  function selectVehicle(vehicle) {
    selectedVehicleData = vehicle;

    // Update preview
    selectedVehiclePreview.innerHTML = `
      <div class="text-left">
        ${vehicle.image ? `<img src="${vehicle.image}" alt="${vehicle.year} ${vehicle.make} ${vehicle.model}" class="w-full h-32 object-cover rounded mb-3">` : '<div class="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-400 text-3xl">🚗</div>'}
        <h4 class="font-semibold mb-2">${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
        ${vehicle.trim ? `<p class="text-sm text-gray-600 mb-2">${vehicle.trim}</p>` : ''}
        <p class="text-primary font-bold text-xl mb-3">$${vehicle.price.toLocaleString()}</p>
        <div class="text-sm text-gray-700 space-y-1">
          <p>📍 ${(vehicle.mileage / 1000).toFixed(0)}K miles</p>
          <p>⚙️ ${vehicle.transmission}</p>
          <p>⛽ ${vehicle.fuelType}</p>
        </div>
      </div>
    `;

    // Refresh list to show selection
    displayVehicleList(filterVehicles(getCurrentFilters()));

    // Show review button instead of next
    nextBtn.classList.add('hidden');
    reviewBtn.classList.remove('hidden');
  }

  // Filter change handlers
  vehicleYearSelect.addEventListener('change', populateVehicleFilters);
  vehicleMakeSelect.addEventListener('change', populateVehicleFilters);
  vehicleModelSelect.addEventListener('change', populateVehicleFilters);

  // Reset search
  resetVehicleSearch.addEventListener('click', () => {
    vehicleYearSelect.value = '';
    vehicleMakeSelect.value = '';
    vehicleModelSelect.value = '';
    selectedVehicleData = null;
    selectedVehiclePreview.innerHTML = '<p class="mb-2">No vehicle selected</p><p class="text-sm">Select a vehicle from the list</p>';
    reviewBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    populateVehicleFilters();
  });

  // Review button handler
  reviewBtn.addEventListener('click', () => {
    if (selectedVehicleData) {
      currentStep = 6;
      populateReviewPage();
      showStep(6);
    }
  });

  // Populate review page
  function populateReviewPage() {
    const formData = new FormData(form);

    // Personal Info
    document.getElementById('reviewPersonal').innerHTML = `
      <div><strong>Name:</strong> ${formData.get('firstName')} ${formData.get('middleInitial') || ''} ${formData.get('lastName')} ${formData.get('suffix') || ''}</div>
      <div><strong>Email:</strong> ${formData.get('email')}</div>
      <div><strong>Phone:</strong> ${formData.get('mobileNumber')}</div>
      <div><strong>SSN:</strong> ***-**-${formData.get('ssn')?.slice(-4) || '****'}</div>
      <div><strong>Driver's License:</strong> ${formData.get('driversLicense')}</div>
      <div><strong>Birth Date:</strong> ${formData.get('birthDate')}</div>
    `;

    // Residence
    document.getElementById('reviewResidence').innerHTML = `
      <div><strong>Address:</strong> ${formData.get('currentAddress')}${formData.get('currentApt') ? ' ' + formData.get('currentApt') : ''}</div>
      <div><strong>City, State, Zip:</strong> ${formData.get('currentCity')}, ${formData.get('currentState')} ${formData.get('currentZip')}</div>
      <div><strong>Status:</strong> ${formData.get('residenceStatus')}</div>
      <div><strong>Monthly Payment:</strong> $${formData.get('monthlyPayment')}</div>
      <div><strong>Time at Residence:</strong> ${formData.get('yearsAtResidence')} years, ${formData.get('monthsAtResidence')} months</div>
    `;

    // Employment
    document.getElementById('reviewEmployment').innerHTML = `
      <div><strong>Employer:</strong> ${formData.get('companyName')}</div>
      <div><strong>Phone:</strong> ${formData.get('employerPhone')}</div>
      <div><strong>Job Title:</strong> ${formData.get('jobTitle')}</div>
      <div><strong>Time at Company:</strong> ${formData.get('yearsAtCompany')} years, ${formData.get('monthsAtCompany')} months</div>
      <div><strong>Monthly Income:</strong> $${formData.get('grossMonthlyIncome')}</div>
    `;

    // Co-Applicant
    if (hasCoApplicant) {
      document.getElementById('reviewCoApplicantSection').classList.remove('hidden');
      document.getElementById('reviewCoApplicant').innerHTML = `
        <div><strong>Name:</strong> ${formData.get('coFirstName')} ${formData.get('coMiddleInitial') || ''} ${formData.get('coLastName')}</div>
        <div><strong>Email:</strong> ${formData.get('coEmail')}</div>
        <div><strong>Phone:</strong> ${formData.get('coMobileNumber')}</div>
        <div><strong>Employer:</strong> ${formData.get('coCompanyName')}</div>
        <div><strong>Monthly Income:</strong> $${formData.get('coGrossMonthlyIncome')}</div>
      `;
    }

    // Vehicle
    if (selectedVehicleData) {
      document.getElementById('reviewVehicle').innerHTML = `
        <div><strong>Vehicle:</strong> ${selectedVehicleData.year} ${selectedVehicleData.make} ${selectedVehicleData.model} ${selectedVehicleData.trim}</div>
        <div><strong>Price:</strong> $${selectedVehicleData.price.toLocaleString()}</div>
        <div><strong>Mileage:</strong> ${(selectedVehicleData.mileage / 1000).toFixed(0)}K miles</div>
        <div><strong>Down Payment:</strong> $${formData.get('downPayment') || '0'}</div>
        ${formData.get('comments') ? `<div class="col-span-2"><strong>Comments:</strong> ${formData.get('comments')}</div>` : ''}
      `;
    }
  }

  // Edit button handlers
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.dataset.step);
      currentStep = targetStep;
      showStep(targetStep);
    });
  });

  // Initialize vehicle filters on step 5
  const originalShowStep = showStep;
  showStep = function(step) {
    originalShowStep(step);

    // Handle step-specific button visibility
    if (step === 6) {
      // Review page: only show Back and Submit buttons
      nextBtn.classList.add('hidden');
      reviewBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else if (step === 5) {
      // Vehicle selection page
      populateVehicleFilters();
      if (selectedVehicleData) {
        // Vehicle selected: show Back and Review Information buttons
        nextBtn.classList.add('hidden');
        reviewBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
      } else {
        // No vehicle selected: hide Review and Submit buttons
        reviewBtn.classList.add('hidden');
        submitBtn.classList.add('hidden');
      }
    } else {
      // Steps 1-4: only show Back and Next buttons
      reviewBtn.classList.add('hidden');
      submitBtn.classList.add('hidden');
    }
  };

});
</script>

<!-- Include vehicle data for dropdowns -->
<div id="vehicle-data" style="display: none;">
  {% assign all_vehicles = site.vehicles | where: "status", "available" %}
  {% for vehicle in all_vehicles %}
  <div class="vehicle-data-item"
       data-year="{{ vehicle.year }}"
       data-make="{{ vehicle.make }}"
       data-model="{{ vehicle.model }}"
       data-trim="{{ vehicle.trim }}"
       data-price="{{ vehicle.price }}"
       data-mileage="{{ vehicle.mileage }}"
       data-transmission="{{ vehicle.transmission }}"
       data-fuel-type="{{ vehicle.fuel_type }}"
       data-image="{{ vehicle.primary_image }}"
       data-url="{{ vehicle.url }}">
  </div>
  {% endfor %}
</div>
