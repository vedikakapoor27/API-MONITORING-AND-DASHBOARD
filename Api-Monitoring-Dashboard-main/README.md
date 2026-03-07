

# 🚀 API Monitoring Dashboard 📊

This project provides a monitoring dashboard for APIs. It allows you to track and visualize the performance of your APIs, providing insights into their response times and uptime.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Backend**: 
  - Uvicorn for the backend server. You can run it with the following command:
    ```
    uvicorn monitoring_system:app --reload
    ```

- **Elastic Search**:
  - Start Elasticsearch by running:
    ```
    bin\elasticsearch.bat [CMD]
    ```

## Features

- **Real-time API Monitoring**: Continuously monitor your APIs and view real-time performance metrics.
- **ElasticSearch Integration**: Integrates with ElasticSearch to store and query logs.
- **User Interface**: Built using modern web technologies, the frontend is designed to be intuitive and responsive.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abhijit826/Api-Monitoring-Dashboard.git
   cd Api-Monitoring-Dashboard
   ```

2. Install the required dependencies:
   - For Python dependencies:
     ```bash
     pip install -r requirements.txt
     ```

   - For the frontend:
     ```bash
     npm install
     ```

## Usage

1. **Start Backend**:
   Launch the backend server using Uvicorn:
   ```bash
   uvicorn monitoring_system:app --reload
   ```

2. **Start Elasticsearch**:
   Make sure Elasticsearch is running on your machine.

3. **Run Frontend**:
   Build and run the frontend application:
   ```bash
   npm run dev
   ```

4. Open the dashboard in your browser at:
   ```
   http://localhost:3000
   ```

## Contributing 🤝

Feel free to fork the repository and submit pull requests for any improvements or bug fixes.

## License 📜

This project is open-source and available under the MIT License.

---


![Screenshot 2025-04-26 185505](https://github.com/user-attachments/assets/7112345f-65b1-4af6-8109-0b445e712e74)
![Screenshot 2025-04-28 100944](https://github.com/user-attachments/assets/e902df79-4681-4636-9715-ebc05b9c40bd)
![Screenshot 2025-04-27 115752](https://github.com/user-attachments/assets/49e0aece-fa87-4a0d-ba00-3975fa09b36e)
![Screenshot 2025-04-27 115738](https://github.com/user-attachments/assets/006dd3dd-f260-4503-b6cb-90af8b14d25a)
![Screenshot 2025-04-27 115726](https://github.com/user-attachments/assets/78747dba-2eff-4f42-a8e8-17c95955742e)
![Screenshot 2025-04-27 095608](https://github.com/user-attachments/assets/9be2739c-9ec9-495f-b0e7-b3514c906f7f)





