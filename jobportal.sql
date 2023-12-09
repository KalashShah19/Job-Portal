-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 09, 2023 at 07:31 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jobportal`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `appId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `jobId` int(11) NOT NULL,
  `appStatus` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`appId`, `userId`, `jobId`, `appStatus`) VALUES
(4, 2, 2, 'monitored'),
(5, 2, 4, 'accepted'),
(6, 2, 5, 'pending'),
(50, 50, 50, '50');

-- --------------------------------------------------------

--
-- Table structure for table `company`
--

CREATE TABLE `company` (
  `coId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `logo` varchar(256) NOT NULL,
  `estDate` date DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `speciality` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `employees` int(11) DEFAULT NULL,
  `openJobs` int(11) DEFAULT NULL,
  `hired` int(11) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `about` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `company`
--

INSERT INTO `company` (`coId`, `userId`, `logo`, `estDate`, `industry`, `speciality`, `type`, `employees`, `openJobs`, `hired`, `website`, `about`) VALUES
(1, 22, 'google.png', '2024-12-09', 'IT', 'web', 'private', 5000, 200, 120000, 'google.com', 'Baap'),
(2, 24, 'demo.png', '2023-12-12', 'IT', 'Softwares', 'private', 1500, 2, 50, 'ms.com', 'MS');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `jobId` int(11) NOT NULL,
  `jobRole` varchar(255) NOT NULL,
  `coId` int(11) NOT NULL,
  `jobType` varchar(255) NOT NULL,
  `jobAddress` varchar(256) NOT NULL,
  `vacancy` int(11) NOT NULL,
  `category` varchar(255) NOT NULL,
  `salary` varchar(200) NOT NULL,
  `jobTiming` varchar(255) NOT NULL,
  `description` varchar(500) NOT NULL,
  `skills` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `startdate` date NOT NULL,
  `endDate` date NOT NULL,
  `hired` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`jobId`, `jobRole`, `coId`, `jobType`, `jobAddress`, `vacancy`, `category`, `salary`, `jobTiming`, `description`, `skills`, `status`, `startdate`, `endDate`, `hired`) VALUES
(2, 'Tester', 1, 'fulltime', 'india', 1, 'office', '150000.00', '9 to 5', 'Software testing is the process of assessing the functionality of a software program. The process checks for errors and gaps and whether the outcome of the application matches desired expectations before the software is installed and goes live.', 'testing', 'on', '2024-11-05', '2024-12-05', 0),
(4, 'dev', 1, 'fulltime', 'new york', 1, 'office', '5000000.00', '9-5', 'Software testing is the process of assessing the functionality of a software program. The process checks for errors and gaps and whether the outcome of the application matches desired expectations before the software is installed and goes live.', 'dev', 'on', '2024-12-05', '2024-12-05', 0),
(5, 'Designer', 1, 'fulltime', 'USA', 1, 'office', '500000', '9-5', 'The Graphic Designer job description includes the entire process of defining requirements, visualizing and creating graphics including illustrations, logos, layouts and photos. You\'ll be the one to shape the visual aspects of websites, books, magazines, product packaging, exhibitions and more.', 'react, angular, figma', 'on', '2023-11-23', '2023-11-30', 0),
(6, 'Hacker', 1, 'fulltime', 'USA', 1, 'office', '75000', '6-4', 'hacking master', 'hacking, reporting, analysing', 'on', '2023-11-12', '2023-09-12', 120000);

-- --------------------------------------------------------

--
-- Table structure for table `jobseeker`
--

CREATE TABLE `jobseeker` (
  `jsId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `image` varchar(256) NOT NULL,
  `resume` varchar(255) DEFAULT NULL,
  `skills` varchar(500) DEFAULT NULL,
  `jsStatus` varchar(20) DEFAULT NULL,
  `experience` varchar(256) DEFAULT NULL,
  `qualification` varchar(256) DEFAULT NULL,
  `hobbies` varchar(256) DEFAULT NULL,
  `achievements` varchar(256) DEFAULT NULL,
  `certifications` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `jobseeker`
--

INSERT INTO `jobseeker` (`jsId`, `userId`, `image`, `resume`, `skills`, `jsStatus`, `experience`, `qualification`, `hobbies`, `achievements`, `certifications`) VALUES
(1, 2, 'IMG_20230315_201849_672.jpg', 'KalashShahResume.pdf', 'html, php, logic', 'seeking', '0', 'MSCIT', 'playing games, watching youtube videos, football', '2022 SSIP hackathon Finalist', 'PHP for beginners, SQL Introduction');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(200) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `usertype` varchar(20) NOT NULL,
  `address` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `name`, `mobile`, `email`, `password`, `usertype`, `address`) VALUES
(2, 'kalash', '9875463219', 'kalashshahnvs@gmail.com', 'kalash', 'client', 'navsari'),
(14, 'vivek', '7984561323', '20bmiit085@gmail.com', 'vivek85', 'client', 'surat'),
(19, 'kalash', '9426921383', '20bmiit040@gmail.com', 'kalash', 'admin', 'navsari'),
(22, 'google', '942921383', 'google@gmail.com', 'google', 'company', 'California'),
(24, 'microsoft', '7896541230', 'ms@bing.com', 'microsoft', 'company', 'US');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`appId`);

--
-- Indexes for table `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`coId`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`jobId`);

--
-- Indexes for table `jobseeker`
--
ALTER TABLE `jobseeker`
  ADD PRIMARY KEY (`jsId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `appId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `company`
--
ALTER TABLE `company`
  MODIFY `coId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `jobId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `jobseeker`
--
ALTER TABLE `jobseeker`
  MODIFY `jsId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
