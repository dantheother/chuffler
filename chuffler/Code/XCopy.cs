using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace chuffler.Code
{
    public class XCopy
    {
        public event EventHandler Completed;
        public event EventHandler<CopyProgressEventArgs> ProgressChanged;

        private int IsCancelled;

        public string Source { get; set; }
        public string Destination { get; set; }

        public XCopy()
        {
            IsCancelled = 0;
        }

        public void Cancel()
        {
            IsCancelled = 1;
        }

        public void Copy(string source, string destination, bool overwrite, bool nobuffering)
        {
            try
            {
                IsCancelled = 0;

                CopyFileFlags copyFileFlags = CopyFileFlags.COPY_FILE_RESTARTABLE;
                if (!overwrite)
                {
                    copyFileFlags |= CopyFileFlags.COPY_FILE_FAIL_IF_EXISTS;
                }

                if (nobuffering)
                {
                    copyFileFlags |= CopyFileFlags.COPY_FILE_NO_BUFFERING;
                }

                Source = source;
                Destination = destination;

                bool result = CopyFileEx(Source, Destination, new CopyProgressRoutine(CopyProgressHandler), IntPtr.Zero, ref IsCancelled, copyFileFlags);
                if (!result)
                    throw new Win32Exception(Marshal.GetLastWin32Error());
            }
            catch (Exception)
            {

                throw;
            }
        }

        public void Move(string source, string destination, bool overwrite)
        {
            try
            {
                IsCancelled = 0;

                MoveFileFlags copyFileFlags = MoveFileFlags.MOVEFILE_COPY_ALLOWED | MoveFileFlags.MOVEFILE_WRITE_THROUGH;
                if (overwrite)
                {
                    copyFileFlags |= MoveFileFlags.MOVEFILE_REPLACE_EXISTING;
                }


                Source = source;
                Destination = destination;

                bool result = MoveFileWithProgress(source, destination, new CopyProgressRoutine(CopyProgressHandler), IntPtr.Zero, copyFileFlags);
                if (!result)
                {
                    throw new Win32Exception(Marshal.GetLastWin32Error());
                }
            }
            catch (Exception)
            {
                throw;
            }
        }


        private void OnProgressChanged(long total, long transferred, long streamSize, long streamByteTrans, uint dwStreamNumber, string source, string dest)
        {

            var handler = ProgressChanged;
            if (handler != null)
            {
                var e = new CopyProgressEventArgs()
                {
                    TotalFileSize = total,
                    TotalBytesTransferred = transferred,
                    StreamSize = streamSize,
                    StreamBytesTransferred = streamByteTrans,
                    StreamNumber = dwStreamNumber,
                    SourceFile = source,
                    DestinationFile = dest
                };
                handler(this, e);
            }
        }

        private void OnCompleted()
        {
            var handler = Completed;
            if (handler != null)
                handler(this, EventArgs.Empty);
        }


        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CopyFileEx(string lpExistingFileName, string lpNewFileName, CopyProgressRoutine lpProgressRoutine, IntPtr lpData, ref Int32 pbCancel, CopyFileFlags dwCopyFlags);

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool MoveFileWithProgress(string lpExistingFileName, string lpNewFileName, CopyProgressRoutine lpProgressRoutine, IntPtr lpData, MoveFileFlags dwCopyFlags);

        private delegate CopyProgressResult CopyProgressRoutine(long TotalFileSize, long TotalBytesTransferred, long StreamSize, long StreamBytesTransferred, uint dwStreamNumber, CopyProgressCallbackReason dwCallbackReason,
                                                        IntPtr hSourceFile, IntPtr hDestinationFile, IntPtr lpData);

        private enum CopyProgressResult : uint
        {
            PROGRESS_CONTINUE = 0,
            PROGRESS_CANCEL = 1,
            PROGRESS_STOP = 2,
            PROGRESS_QUIET = 3
        }

        private enum CopyProgressCallbackReason : uint
        {
            CALLBACK_CHUNK_FINISHED = 0x00000000,
            CALLBACK_STREAM_SWITCH = 0x00000001
        }

        [Flags]
        private enum CopyFileFlags : uint
        {
            COPY_FILE_FAIL_IF_EXISTS = 0x00000001,
            COPY_FILE_NO_BUFFERING = 0x00001000,
            COPY_FILE_RESTARTABLE = 0x00000002,
            COPY_FILE_OPEN_SOURCE_FOR_WRITE = 0x00000004,
            COPY_FILE_ALLOW_DECRYPTED_DESTINATION = 0x00000008
        }
        [Flags]
        enum MoveFileFlags
        {
            MOVEFILE_REPLACE_EXISTING = 0x00000001,
            MOVEFILE_COPY_ALLOWED = 0x00000002,
            MOVEFILE_DELAY_UNTIL_REBOOT = 0x00000004,
            MOVEFILE_WRITE_THROUGH = 0x00000008,
            MOVEFILE_CREATE_HARDLINK = 0x00000010,
            MOVEFILE_FAIL_IF_NOT_TRACKABLE = 0x00000020
        }

        private CopyProgressResult CopyProgressHandler(long total, long transferred, long streamSize, long streamByteTrans, uint dwStreamNumber,
                                                       CopyProgressCallbackReason reason, IntPtr hSourceFile, IntPtr hDestinationFile, IntPtr lpData)
        {
            if (reason == CopyProgressCallbackReason.CALLBACK_CHUNK_FINISHED)
            {
                string source = (IntPtr.Zero.Equals(hSourceFile)) ? string.Empty : Marshal.PtrToStringAuto(hSourceFile);
                string dest = (IntPtr.Zero.Equals(hDestinationFile)) ? string.Empty : Marshal.PtrToStringAuto(hDestinationFile);
                OnProgressChanged(total, transferred, streamSize, streamByteTrans, dwStreamNumber, source, dest);
            }

            if ((transferred >= total) || (IsCancelled == 0))
                OnCompleted();

            if (IsCancelled == 0)
            {
                return CopyProgressResult.PROGRESS_CONTINUE;
            }
            else
            {
                return CopyProgressResult.PROGRESS_CANCEL;
            }
        }


    }

    public class CopyProgressEventArgs : EventArgs
    {
        public CopyProgressEventArgs() : base() { }
        public long TotalFileSize { get; set; }
        public long TotalBytesTransferred { get; set; }
        public long StreamSize { get; set; }
        public long StreamBytesTransferred { get; set; }
        public uint StreamNumber { get; set; }
        public string SourceFile { get; set; }
        public string DestinationFile { get; set; }
    }

}