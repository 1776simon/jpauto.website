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
                <input type="text" name="currentZip" required pattern="[0-9]{5}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
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
                <input type="text" name="previousZip" pattern="[0-9]{5}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
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
                  <input type="text" name="coCurrentZip" pattern="[0-9]{5}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent co-applicant-field">
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
            <h2 class="text-2xl font-bold mb-6"><span class="final-step-text">Step 4</span>: Vehicle Selection</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label class="block text-sm font-semibold mb-2">Year</label>
                <select name="vehicleYear" id="vehicleYear" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select Year...</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                  <option value="2017">2017</option>
                  <option value="2016">2016</option>
                  <option value="2015">2015</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Make</label>
                <select name="vehicleMake" id="vehicleMake" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select Make...</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2">Model</label>
                <select name="vehicleModel" id="vehicleModel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Select Model...</option>
                </select>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-semibold mb-2">Down Payment</label>
              <input type="number" name="downPayment" placeholder="$" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <div id="vehicleDetails" class="bg-gray-50 p-6 rounded-lg mb-6 hidden">
              <h3 class="text-lg font-semibold mb-4">Selected Vehicle</h3>
              <div id="vehicleInfo"></div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-semibold mb-2">Additional Comments</label>
              <textarea name="comments" rows="4" placeholder="Any additional information you'd like to share..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
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
(function() {
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

  // Vehicle dropdowns - populate from inventory
  const vehicleYearSelect = document.getElementById('vehicleYear');
  const vehicleMakeSelect = document.getElementById('vehicleMake');
  const vehicleModelSelect = document.getElementById('vehicleModel');

  // Populate makes from inventory
  function populateVehicleMakes() {
    const makes = new Set();
    vehicleDataItems.forEach(item => {
      const make = item.dataset.make;
      if (make) makes.add(make);
    });

    Array.from(makes).sort().forEach(make => {
      const option = document.createElement('option');
      option.value = make;
      option.textContent = make;
      vehicleMakeSelect.appendChild(option);
    });
  }

  // Update models based on make
  vehicleMakeSelect.addEventListener('change', function() {
    const selectedMake = this.value;
    vehicleModelSelect.innerHTML = '<option value="">Select Model...</option>';

    if (!selectedMake) {
      vehicleModelSelect.disabled = true;
      return;
    }

    const models = new Set();
    vehicleDataItems.forEach(item => {
      if (item.dataset.make === selectedMake) {
        const model = item.dataset.model;
        if (model) models.add(model);
      }
    });

    Array.from(models).sort().forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      vehicleModelSelect.appendChild(option);
    });

    vehicleModelSelect.disabled = false;
  });

  // Initialize vehicle dropdowns
  populateVehicleMakes();

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
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateStep(currentStep)) {
      // Collect form data
      const formData = new FormData(form);

      // Here you would normally send to your backend
      console.log('Form submitted:', Object.fromEntries(formData));

      // Hide form and show success message
      const formContainer = document.querySelector('.max-w-4xl > .bg-white');
      const successMessage = document.getElementById('successMessage');

      formContainer.style.display = 'none';
      successMessage.classList.remove('hidden');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  function showStep(step) {
    // Hide all steps
    formSteps.forEach(s => s.classList.remove('active'));

    // Show current step
    const actualStep = hasCoApplicant ? step : (step === 5 ? 5 : step);
    const stepElement = document.querySelector(`.form-step[data-step="${actualStep}"]`);
    if (stepElement) {
      stepElement.classList.add('active');
    }

    // Update buttons
    prevBtn.classList.toggle('hidden', step === 1);

    const isLastStep = (!hasCoApplicant && step === 4) || (hasCoApplicant && step === 5);
    nextBtn.classList.toggle('hidden', step === (hasCoApplicant ? 5 : 4));
    submitBtn.classList.toggle('hidden', !isLastStep);

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

    requiredFields.forEach(field => {
      // Skip disabled fields
      if (field.disabled) return;

      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('border-red-500');

        // Remove error styling on input
        field.addEventListener('input', function() {
          this.classList.remove('border-red-500');
        }, { once: true });
      } else {
        field.classList.remove('border-red-500');
      }
    });

    if (!isValid) {
      alert('Please fill in all required fields.');
    }

    return isValid;
  }

  // Add active class styling
  const style = document.createElement('style');
  style.textContent = `
    .form-step { display: none; }
    .form-step.active { display: block; }
  `;
  document.head.appendChild(style);
})();
</script>

<!-- Include vehicle data for dropdowns -->
<div id="vehicle-data" style="display: none;">
  {% assign all_vehicles = site.vehicles | where: "status", "available" %}
  {% for vehicle in all_vehicles %}
  <div class="vehicle-data-item"
       data-make="{{ vehicle.make }}"
       data-model="{{ vehicle.model }}">
  </div>
  {% endfor %}
</div>
